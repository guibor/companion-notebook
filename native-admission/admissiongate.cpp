#include "admissiongate.h"
#include <QCoreApplication>
#include <QEvent>
#include <QMetaMethod>
#include <QPointer>
#include <QScopedValueRollback>
#include <QThread>
#include <QVariant>
#include <atomic>
#include <condition_variable>
#include <cstring>
#include <mutex>

struct AdmissionCallState {
    bool mutating = false; // UI only, separate allocation survives callbacks.
    std::atomic<bool> unavailable {false}; // Set before owner destruction/move.
};
struct AdmissionPark {
    std::mutex mutex;
    std::condition_variable wake;
    bool parked = false;
    bool released = false;
    std::atomic<bool> managerUnavailable {false};
    // All fields below belong to the original UI thread.
    QPointer<QObject> manager;
    bool nestedPublication = false;
    bool invalidPublication = false;
    unsigned finalPublications = 0;
    QMetaObject::Connection regionConnection;
    QMetaObject::Connection inputsConnection;
    QMetaObject::Connection destructionConnection;
    QObject *watch = nullptr;
};
namespace {
struct Registry {
    std::mutex mutex;
    QThread *identity = nullptr; // Comparison only after capture.
    QObject *workerRelay = nullptr;
    QObject *uiRelay = nullptr;
    quint64 epoch = 1;
    bool valid = false;
    bool seen = false;
    QPointer<AdmissionGate> owner; // UI only.
    std::shared_ptr<AdmissionPark> active; // Resident until successful release.
};
Registry &registry() { static auto *r = new Registry; return *r; }
bool uiThread()
{
    auto *app = QCoreApplication::instance();
    return app && QThread::currentThread() == app->thread();
}
bool matches(quint64 epoch)
{
    auto &r = registry();
    std::lock_guard<std::mutex> lock(r.mutex);
    return r.valid && r.epoch == epoch;
}
void invalidate()
{
    auto &r = registry();
    std::lock_guard<std::mutex> lock(r.mutex);
    r.valid = false; ++r.epoch;
}
class ManagerWatch final : public QObject {
public:
    ManagerWatch(std::shared_ptr<AdmissionPark> park, QObject *parent)
        : QObject(parent), m_park(std::move(park)) {}
    bool eventFilter(QObject *, QEvent *event) override
    {
        if (event->type() == QEvent::ThreadChange)
            m_park->managerUnavailable.store(true);
        return false;
    }
private:
    std::shared_ptr<AdmissionPark> m_park;
};
bool liveManager(const std::shared_ptr<AdmissionPark> &park)
{
    return !park->managerUnavailable.load() && park->manager
        && park->manager->thread() == QThread::currentThread();
}
}

void companionObserveSelfMove(QObject *object, QThread *target, bool succeeded)
{
    if (!succeeded || !object) return;
    auto &r = registry();
    {
        std::lock_guard<std::mutex> lock(r.mutex);
        // Later successful moves invalidate even if moving AWAY from self.
        if (object == r.identity) { r.valid = false; ++r.epoch; return; }
    }
    if (object != target || !uiThread()
        || std::strcmp(object->metaObject()->className(), "PenInputThread") != 0
        || object->thread() != target) return;
    quint64 epoch;
    {
        std::lock_guard<std::mutex> lock(r.mutex);
        if (r.seen) { r.valid = false; ++r.epoch; return; }
        r.seen = true; epoch = r.epoch;
    }
    auto *ui = new QObject;
    auto *worker = new QObject;
    if (!worker->moveToThread(target)) { delete worker; delete ui; invalidate(); return; }
    const auto finished = QObject::connect(target, &QThread::finished, worker,
        [] { invalidate(); }, Qt::DirectConnection);
    const auto destroyed = QObject::connect(target, &QObject::destroyed, ui,
        [] { invalidate(); }, Qt::DirectConnection);
    const auto shutdown = QObject::connect(QCoreApplication::instance(),
        &QCoreApplication::aboutToQuit, ui, [] { invalidate(); }, Qt::DirectConnection);
    std::lock_guard<std::mutex> lock(r.mutex);
    r.identity = target; r.workerRelay = worker; r.uiRelay = ui;
    r.valid = r.epoch == epoch && target->isRunning()
        && bool(finished) && bool(destroyed) && bool(shutdown);
}

AdmissionGate::AdmissionGate(QObject *parent)
    : QObject(parent), m_call(std::make_shared<AdmissionCallState>()) {}
AdmissionGate::~AdmissionGate()
{
    m_call->unavailable.store(true);
    if (m_park) qCritical("Companion admission: owner lost during transaction; recovery required");
    // Registry retains failures. No destructor unblocks signals or native work.
}
bool AdmissionGate::event(QEvent *event)
{
    if (event->type() == QEvent::ThreadChange) m_call->unavailable.store(true);
    return QObject::event(event);
}
bool AdmissionGate::onUi() const
{
    return uiThread() && thread() == QThread::currentThread() && !m_call->unavailable.load();
}
void AdmissionGate::setPhase(const QString &phase)
{
    m_phase = phase;
    const auto call = m_call;
    QMetaObject::invokeMethod(this, [this, call] {
        if (!call->unavailable.load()) emit phaseChanged();
    }, Qt::QueuedConnection);
}
bool AdmissionGate::refuse(const QString &reason)
{
    m_error = reason; setPhase(m_phase); return false;
}
void AdmissionGate::observeRegion(QRegion region)
{
    if (!onUi()) { invalidate(); return; }
    if (m_park && sender() == m_park->manager && m_phase == "sealing" && !region.isEmpty())
        m_park->nestedPublication = true;
}
void AdmissionGate::observeInputs()
{
    if (!onUi()) { invalidate(); return; }
    if (!m_park || sender() != m_park->manager || m_phase != "publishing") return;
    if (!liveManager(m_park) || m_park->manager->signalsBlocked() || !matches(m_epoch))
        m_park->invalidPublication = true;
    else ++m_park->finalPublications;
}
bool AdmissionGate::initialize()
{
    if (!onUi() || m_call->mutating || m_phase != "cold") return false;
    auto call = m_call;
    QScopedValueRollback<bool> mutation(call->mutating, true);
    auto &r = registry();
    QObject *worker; QObject *ui; QThread *identity;
    {
        std::lock_guard<std::mutex> lock(r.mutex);
        if (!r.valid || r.active || (r.owner && r.owner != this)) return refuse("worker-unavailable");
        r.owner = this; m_epoch = r.epoch;
        worker = r.workerRelay; ui = r.uiRelay; identity = r.identity;
    }
    const QPointer<AdmissionGate> self(this);
    const auto epoch = m_epoch;
    m_phase = "probing";
    const bool posted = QMetaObject::invokeMethod(worker, [self, call, ui, epoch, identity] {
        const bool valid = QThread::currentThread() == identity && matches(epoch);
        QMetaObject::invokeMethod(ui, [self, call, epoch, valid] {
            if (call->unavailable.load() || !self || !self->onUi()
                || self->m_epoch != epoch || self->m_phase != "probing") return;
            if (!valid || !matches(epoch)) { self->setPhase("failed"); return; }
            self->setPhase("ready");
            emit self->ready(); // No later dereference after external callback.
        }, Qt::QueuedConnection);
    }, Qt::QueuedConnection);
    if (!posted) { m_phase = "failed"; return refuse("worker-post-failed"); }
    setPhase(m_phase); return true;
}
bool AdmissionGate::pause(QObject *manager, int generation)
{
    if (!onUi() || m_call->mutating || m_phase != "ready" || !matches(m_epoch)) return false;
    auto call = m_call;
    QScopedValueRollback<bool> mutation(call->mutating, true);
    if (generation <= m_generation || !manager || manager->thread() != thread() || manager->signalsBlocked()
        || std::strcmp(manager->metaObject()->className(), "PenInputSurfaceManager") != 0
        || manager->metaObject()->indexOfSignal("regionChanged(QRegion)") < 0
        || manager->metaObject()->indexOfMethod("updateRegions()") < 0
        || manager->property("region").metaType() != QMetaType::fromType<QRegion>())
        return refuse("invalid-manager-or-generation");
    QMetaMethod inputsSignal;
    for (int i = 0; i < manager->metaObject()->methodCount(); ++i) {
        const auto method = manager->metaObject()->method(i);
        if (method.methodType() == QMetaMethod::Signal && method.name() == "activeInputsChanged"
            && method.parameterCount() == 1) {
            if (inputsSignal.isValid()) return refuse("ambiguous-inputs-signal");
            inputsSignal = method;
        }
    }
    if (!inputsSignal.isValid()) return refuse("missing-inputs-signal");
    auto park = std::make_shared<AdmissionPark>();
    park->manager = manager;
    auto &r = registry();
    QObject *worker; QObject *ui; QThread *identity;
    {
        std::lock_guard<std::mutex> lock(r.mutex);
        if (!r.valid || r.epoch != m_epoch || r.active) return refuse("worker-unavailable");
        r.active = park;
        worker = r.workerRelay; ui = r.uiRelay; identity = r.identity;
    }
    m_park = park; m_generation = generation; m_phase = "sealing";
    park->watch = new ManagerWatch(park, ui);
    manager->installEventFilter(park->watch);
    park->destructionConnection = QObject::connect(manager, &QObject::destroyed, ui, [park] {
        park->managerUnavailable.store(true);
    }, Qt::DirectConnection);
    park->regionConnection = QObject::connect(manager, SIGNAL(regionChanged(QRegion)),
        this, SLOT(observeRegion(QRegion)), Qt::DirectConnection);
    park->inputsConnection = QObject::connect(manager, inputsSignal, this,
        metaObject()->method(metaObject()->indexOfSlot("observeInputs()")), Qt::DirectConnection);
    if (!park->regionConnection || !park->inputsConnection || !park->destructionConnection) {
        setPhase("failed"); return refuse("manager-observation-failed");
    }
    const QPointer<AdmissionGate> self(this);
    const auto epoch = m_epoch;
    const bool sealed = QMetaObject::invokeMethod(manager, "regionChanged", Qt::DirectConnection,
                                                   Q_ARG(QRegion, QRegion()));
    if (call->unavailable.load() || !self) return false;
    if (!onUi() || !liveManager(park) || !matches(epoch) || m_park != park
        || !sealed || park->nestedPublication) {
        setPhase("failed"); return refuse("producer-seal-invalidated");
    }
    manager->blockSignals(true);
    m_phase = "draining";
    const bool posted = QMetaObject::invokeMethod(worker, [self, call, park, ui, epoch, identity, generation] {
        if (QThread::currentThread() != identity || !matches(epoch)) return;
        std::unique_lock<std::mutex> lock(park->mutex);
        park->parked = true;
        QMetaObject::invokeMethod(ui, [self, call, park, epoch, generation] {
            if (call->unavailable.load() || !self || !self->onUi() || !liveManager(park)
                || !matches(epoch) || self->m_epoch != epoch || self->m_park != park
                || self->m_generation != generation || self->m_phase != "draining") return;
            self->setPhase("parked");
            emit self->parked(generation);
        }, Qt::QueuedConnection);
        park->wake.wait(lock, [&] { return park->released; });
    }, Qt::QueuedConnection);
    if (!posted) { m_phase = "failed"; return refuse("worker-post-failed"); }
    setPhase(m_phase); return true;
}
bool AdmissionGate::permitPublication(int generation)
{
    if (!onUi() || m_call->mutating || m_phase != "parked" || generation != m_generation
        || !matches(m_epoch) || !m_park) return false;
    auto call = m_call;
    QScopedValueRollback<bool> mutation(call->mutating, true);
    const auto park = m_park;
    if (!liveManager(park) || !park->manager->signalsBlocked()
        || !park->manager->property("region").value<QRegion>().isEmpty())
        return refuse("old-inputs-not-detached");
    // Empty global region is necessary, NOT proof of an empty active list.
    // Host must also detach every old input and prepare final geometry first.
    park->finalPublications = 0;
    park->invalidPublication = false;
    park->manager->blockSignals(false);
    setPhase("publishing"); return true;
}
bool AdmissionGate::finish(int generation)
{
    if (!onUi() || m_call->mutating || m_phase != "publishing" || generation != m_generation
        || !matches(m_epoch) || !m_park) return false;
    auto call = m_call;
    QScopedValueRollback<bool> mutation(call->mutating, true);
    auto park = m_park;
    if (!liveManager(park) || park->manager->signalsBlocked()) return refuse("manager-unavailable");
    const QPointer<AdmissionGate> self(this);
    const auto epoch = m_epoch;
    const bool updated = QMetaObject::invokeMethod(park->manager, "updateRegions", Qt::DirectConnection);
    if (call->unavailable.load() || !self) return false;
    if (!onUi() || !liveManager(park) || !matches(epoch) || m_park != park
        || !updated || park->manager->signalsBlocked() || park->invalidPublication) {
        setPhase("failed"); return refuse("final-publication-invalidated");
    }
    if (!park->finalPublications) return refuse("fresh-candidates-not-published");
    {
        std::lock_guard<std::mutex> lock(park->mutex);
        if (!park->parked || park->released) return refuse("park-state-invalid");
        park->released = true;
    }
    park->wake.notify_one();
    QObject::disconnect(park->regionConnection);
    QObject::disconnect(park->inputsConnection);
    QObject::disconnect(park->destructionConnection);
    park->manager->removeEventFilter(park->watch);
    delete park->watch; park->watch = nullptr;
    { auto &r = registry(); std::lock_guard<std::mutex> lock(r.mutex); r.active.reset(); }
    m_park.reset(); setPhase("ready");
    QMetaObject::invokeMethod(this, [this, call, generation] {
        if (!call->unavailable.load()) emit resumed(generation);
    }, Qt::QueuedConnection);
    return true;
}
