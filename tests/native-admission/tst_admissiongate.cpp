#include "admissiongate.h"
#include <QCoreApplication>
#include <QElapsedTimer>
#include <QEventLoop>
#include <QList>
#include <QPointer>
#include <QProcess>
#include <QProcessEnvironment>
#include <QRegion>
#include <QSignalSpy>
#include <QTest>
#include <QThread>
#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <functional>

class PenInputThread : public QThread { Q_OBJECT };
class PenInputSurfaceManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(QRegion region READ region NOTIFY regionChanged)
public:
    QRegion region() const { return cached; }
    QRegion desired {0, 0, 100, 100};
    QRegion cached {0, 0, 100, 100};
    QRegion producer {0, 0, 100, 100};
    std::atomic<int> candidates {1};
    QList<int> desiredInputs {1};
    QList<int> cachedInputs {1};
    int desiredGeometryRevision = 0;
    int cachedGeometryRevision = 0;
    std::function<void()> beforeUpdate;
    PenInputSurfaceManager()
    {
        connect(this, &PenInputSurfaceManager::regionChanged, this,
                [this](const QRegion &value) { producer = value; }, Qt::DirectConnection);
        connect(this, &PenInputSurfaceManager::activeInputsChanged, this,
                [this](const QList<int> &inputs) { candidates.store(int(inputs.size())); },
                Qt::DirectConnection);
    }
    Q_INVOKABLE void updateRegions()
    {
        const QPointer<PenInputSurfaceManager> self(this);
        // Copy before invoking: a lifetime regression may delete this manager.
        const auto callback = beforeUpdate;
        if (callback) callback();
        if (!self) return;
        const bool geometryDirty = cachedGeometryRevision != desiredGeometryRevision;
        cachedGeometryRevision = desiredGeometryRevision;
        if (cached != desired) { cached = desired; emit regionChanged(cached); }
        if (!self) return;
        const bool inputsChanged = cachedInputs != desiredInputs;
        cachedInputs = desiredInputs;
        // Native caches mutate even when signals are blocked. A subsequent
        // unchanged refresh does NOT replay candidate installation. Global
        // region changes (for example exclusions) are not handler geometry.
        if (inputsChanged || geometryDirty) emit activeInputsChanged(cachedInputs);
    }
signals:
    void regionChanged(QRegion region);
    void activeInputsChanged(QList<int> inputs);
};

namespace {
void childRequire(bool condition, const char *message)
{
    if (condition) return;
    std::fprintf(stderr, "ISOLATED_ADMISSION_FAIL: %s\n", message);
    std::fflush(stderr);
    std::_Exit(1);
}
bool waitFor(const std::function<bool()> &condition)
{
    QElapsedTimer elapsed;
    elapsed.start();
    while (!condition() && elapsed.elapsed() < 1000) {
        QCoreApplication::processEvents(QEventLoop::AllEvents, 5);
        QThread::msleep(1);
    }
    return condition();
}
// Failure cases deliberately leave the worker sealed. Run each in a separate
// bounded process and exit without QObject teardown; never add a test-only
// unpark/reset API to production merely to make test cleanup convenient.
[[noreturn]] void isolatedCase(const QByteArray &name)
{
    auto *worker = new PenInputThread;
    worker->start();
    childRequire(worker->moveToThread(worker), "initial worker self-move");
    companionObserveSelfMove(worker, worker, true);
    auto *gate = new AdmissionGate;
    QPointer<AdmissionGate> gateGuard(gate);
    auto *manager = new PenInputSurfaceManager;
    QPointer<PenInputSurfaceManager> managerGuard(manager);
    childRequire(gate->initialize(), "initialize");
    childRequire(waitFor([&] { return gate->phase() == "ready"; }), "ready roundtrip");

    if (name == "manager-deleted-during-seal") {
        QObject::connect(manager, &PenInputSurfaceManager::regionChanged,
                         QCoreApplication::instance(), [manager](const QRegion &region) {
            if (region.isEmpty()) delete manager;
        }, Qt::DirectConnection);
        childRequire(!gate->pause(manager, 1), "deleted manager must reject seal");
        childRequire(!managerGuard, "manager deletion happened");
    } else if (name == "owner-deleted-during-seal") {
        QObject::connect(manager, &PenInputSurfaceManager::regionChanged,
                         QCoreApplication::instance(), [gate](const QRegion &region) {
            if (region.isEmpty()) delete gate;
        }, Qt::DirectConnection);
        childRequire(!gate->pause(manager, 1), "deleted owner must reject seal");
        childRequire(!gateGuard, "owner deletion happened");
        AdmissionGate replacement;
        childRequire(!replacement.initialize(), "lost active owner must not permit replacement");
    } else if (name == "nested-seal-reopen") {
        QObject::connect(manager, &PenInputSurfaceManager::regionChanged, manager,
                         [manager](const QRegion &region) {
            if (region.isEmpty()) {
                manager->desired = QRegion(40, 40, 20, 20);
                manager->updateRegions();
            }
        }, Qt::DirectConnection);
        childRequire(!gate->pause(manager, 1), "nested nonempty publication must reject seal");
        childRequire(gate->phase() != "draining" && gate->phase() != "parked",
                     "failed seal must not claim drained or parked");
    } else if (name == "manager-moved-during-seal") {
        auto *other = new QThread;
        other->start();
        QObject::connect(manager, &PenInputSurfaceManager::regionChanged,
                         QCoreApplication::instance(), [manager, other](const QRegion &region) {
            if (region.isEmpty()) childRequire(manager->moveToThread(other), "manager move");
        }, Qt::DirectConnection);
        childRequire(!gate->pause(manager, 1), "moved manager must reject seal");
    } else if (name == "owner-moved-before-ack") {
        // Use a fresh gate so the move occurs between posting and its UI ack.
        delete gate;
        gate = new AdmissionGate;
        auto *other = new QThread;
        other->start();
        std::atomic<int> readyCount {0};
        QObject::connect(gate, &AdmissionGate::ready, QCoreApplication::instance(),
                         [&] { ++readyCount; }, Qt::DirectConnection);
        childRequire(gate->initialize(), "second initialize");
        childRequire(gate->moveToThread(other), "owner move");
        QElapsedTimer elapsed;
        elapsed.start();
        while (elapsed.elapsed() < 50)
            QCoreApplication::processEvents(QEventLoop::AllEvents, 5);
        childRequire(readyCount.load() == 0, "moved owner must not announce ready");
    } else if (name == "worker-moved-after-capture") {
        auto *other = new QThread;
        other->start();
        std::atomic<bool> moved {false};
        childRequire(QMetaObject::invokeMethod(worker, [worker, other, &moved] {
            const bool success = worker->moveToThread(other);
            // macOS unit build does not install the Linux preload hook.
            companionObserveSelfMove(worker, other, success);
            moved.store(success);
        }, Qt::QueuedConnection), "post worker move");
        childRequire(waitFor([&] { return moved.load(); }), "worker move completed");
        childRequire(!gate->pause(manager, 1), "different worker queue must invalidate capture");
    } else if (name == "owner-lost-before-invalidated-park") {
        std::atomic<bool> proceed {false};
        std::atomic<bool> callbackPassed {false};
        childRequire(QMetaObject::invokeMethod(worker, [worker, &proceed] {
            QElapsedTimer deadline;
            deadline.start();
            while (!proceed.load() && deadline.elapsed() < 1000) QThread::msleep(1);
            childRequire(proceed.load(), "release preceding test callback");
            const bool success = worker->moveToThread(worker);
            childRequire(success, "repeat successful self move");
            companionObserveSelfMove(worker, worker, success);
        }, Qt::QueuedConnection), "queue before park");
        childRequire(gate->pause(manager, 1), "seal with fence still queued");
        delete gate;
        childRequire(QMetaObject::invokeMethod(worker, [&callbackPassed] {
            callbackPassed.store(true);
        }, Qt::QueuedConnection), "queue after invalidated park callback");
        proceed.store(true);
        childRequire(waitFor([&] { return callbackPassed.load(); }), "invalidated park callback returned");
        childRequire(manager->signalsBlocked(), "failed callback cleanup must not unblock signals");
        AdmissionGate replacement;
        childRequire(!replacement.initialize(), "invalidated retained transaction excludes replacement");
    } else {
        childRequire(gate->pause(manager, 1), "pause for lifetime case");
        childRequire(waitFor([&] { return gate->phase() == "parked"; }), "park roundtrip");
        if (name == "owner-deleted-while-parked") {
            delete gate;
            childRequire(manager->signalsBlocked(), "owner destruction must not unblock manager");
            std::atomic<bool> ran {false};
            childRequire(QMetaObject::invokeMethod(worker, [&] { ran.store(true); },
                                                  Qt::QueuedConnection), "queue behind park");
            QThread::msleep(30);
            childRequire(!ran.load(), "owner destruction must not release worker");
            AdmissionGate replacement;
            childRequire(!replacement.initialize(), "retained transaction excludes replacement owner");
        } else if (name == "manager-deleted-while-parked") {
            delete manager;
            childRequire(!gate->permitPublication(1), "dead manager must reject permit");
            delete gate; // Must not restore signals through a dangling blocker.
            AdmissionGate replacement;
            childRequire(!replacement.initialize(), "dead manager leaves transaction fail-closed");
        } else {
            manager->desired = {};
            manager->desiredInputs = {};
            manager->updateRegions();
            childRequire(gate->permitPublication(1), "permit final publication");
            manager->desired = QRegion(0, 100, 100, 200);
            manager->desiredInputs = {2, 3};
            manager->updateRegions();
            if (name == "owner-deleted-during-finish")
                manager->beforeUpdate = [gate] { delete gate; };
            else if (name == "manager-deleted-during-finish")
                manager->beforeUpdate = [manager] { delete manager; };
            else
                childRequire(false, "unknown isolated scenario");
            childRequire(!gate->finish(1), "lifetime loss during refresh must reject finish");
            AdmissionGate replacement;
            childRequire(!replacement.initialize(), "failed final refresh excludes replacement");
        }
    }
    std::puts("ISOLATED_ADMISSION_PASS");
    std::fflush(stdout);
    std::_Exit(0);
}
}

class TestAdmissionGate : public QObject {
    Q_OBJECT
    PenInputThread worker;
    int next = 0;
    void start(AdmissionGate &gate)
    {
        QVERIFY(gate.initialize());
        QCOMPARE(gate.phase(), QString("probing"));
        QTRY_COMPARE(gate.phase(), QString("ready"));
    }
    void closeAndPublish(AdmissionGate &gate, PenInputSurfaceManager &manager, int generation)
    {
        manager.desired = {};
        manager.desiredInputs = {};
        manager.updateRegions();
        QVERIFY(manager.producer.isEmpty());
        QVERIFY(gate.permitPublication(generation));
        QVERIFY(!manager.signalsBlocked());
        manager.desired = QRegion(0, 100, 100, 200);
        manager.desiredInputs = {2, 3};
        manager.updateRegions();
        QVERIFY(gate.finish(generation));
        QCOMPARE(gate.phase(), QString("ready"));
    }
private slots:
    void initTestCase()
    {
        worker.start();
        QVERIFY(worker.moveToThread(&worker));
        // macOS unit tests exercise the real public self-move and registry,
        // Linux standalone smoke separately verifies actual ELF interposition.
        companionObserveSelfMove(&worker, &worker, true);
    }
    void coldStartRoundtrip()
    {
        AdmissionGate gate;
        start(gate);
        QVERIFY(!gate.initialize());
    }
    void exclusiveOwner()
    {
        AdmissionGate first, second;
        start(first);
        QVERIFY(!second.initialize());
        QCOMPARE(second.error(), QString("worker-unavailable"));
        QCOMPARE(first.phase(), QString("ready"));
    }
    void invalidManagerDoesNotSeal()
    {
        AdmissionGate gate; start(gate);
        QObject wrong;
        QVERIFY(!gate.pause(&wrong, ++next));
        QCOMPARE(gate.phase(), QString("ready"));
        PenInputSurfaceManager manager;
        manager.blockSignals(true);
        QVERIFY(!gate.pause(&manager, ++next));
        QVERIFY(!manager.producer.isEmpty());
    }
    void priorCompletionPrecedesPark()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        bool copied = false;
        const int generation = ++next;
        QVERIFY(QMetaObject::invokeMethod(&worker, [&] {
            QThread::msleep(20);
            QMetaObject::invokeMethod(this, [&] { copied = true; }, Qt::QueuedConnection);
        }, Qt::QueuedConnection));
        QVERIFY(gate.pause(&manager, generation));
        QVERIFY(manager.producer.isEmpty());
        QVERIFY(manager.signalsBlocked());
        QCOMPARE(gate.phase(), QString("draining"));
        QVERIFY(!gate.permitPublication(generation));
        QTRY_COMPARE(gate.phase(), QString("parked"));
        QVERIFY(copied);
        QVERIFY(!gate.finish(generation));
        QVERIFY(!gate.permitPublication(generation));
        QCOMPARE(gate.error(), QString("old-inputs-not-detached"));
        closeAndPublish(gate, manager, generation);
    }
    void noWorkUntilFinalCandidates()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        const int generation = ++next;
        QVERIFY(gate.pause(&manager, generation));
        QTRY_COMPARE(gate.phase(), QString("parked"));
        std::atomic<int> observed {0};
        QVERIFY(QMetaObject::invokeMethod(&worker, [&] {
            observed.store(manager.candidates.load());
        }, Qt::QueuedConnection));
        QTest::qWait(30);
        QCOMPARE(observed.load(), 0);
        QVERIFY(!gate.finish(generation + 1));
        QVERIFY(!gate.permitPublication(generation + 1));
        closeAndPublish(gate, manager, generation);
        QTRY_COMPARE(observed.load(), 2);
        QVERIFY(!gate.finish(generation));
        QVERIFY(!gate.pause(&manager, generation));
    }
    void blockedPublicationsStaySealed()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        const int generation = ++next;
        QVERIFY(gate.pause(&manager, generation));
        QTRY_COMPARE(gate.phase(), QString("parked"));
        for (int i = 0; i < 20; ++i) {
            manager.desired = QRegion(i, i, 40, 40);
            manager.updateRegions();
            QVERIFY(manager.producer.isEmpty());
        }
        closeAndPublish(gate, manager, generation);
    }
    void unchangedCacheDoesNotCountAsPublication()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        const int generation = ++next;
        QVERIFY(gate.pause(&manager, generation));
        QTRY_COMPARE(gate.phase(), QString("parked"));
        manager.desired = {};
        manager.desiredInputs = {};
        manager.updateRegions();
        QVERIFY(manager.cachedInputs.isEmpty());
        QCOMPARE(manager.candidates.load(), 1); // Suppressed detach was not delivered.
        QVERIFY(gate.permitPublication(generation));
        QVERIFY(!gate.finish(generation)); // An unchanged refresh cannot replay it.
        QCOMPARE(gate.phase(), QString("publishing"));
        QCOMPARE(manager.candidates.load(), 1);
        // A global-only region change still does not update the native list.
        manager.desired = QRegion(0, 100, 100, 200);
        manager.updateRegions();
        QVERIFY(!gate.finish(generation));
        manager.desiredInputs = {2, 3};
        manager.updateRegions();
        QCOMPARE(manager.candidates.load(), 2);
        QVERIFY(gate.finish(generation));
    }
    void fakePreservesIdentityAndGeometrySemantics()
    {
        PenInputSurfaceManager manager;
        QSignalSpy changed(&manager, &PenInputSurfaceManager::activeInputsChanged);
        manager.desiredInputs = {7}; // Same count, different native identities.
        manager.updateRegions();
        QCOMPARE(changed.size(), 1);
        ++manager.desiredGeometryRevision;
        manager.updateRegions();
        QCOMPARE(changed.size(), 2);
        manager.updateRegions();
        QCOMPARE(changed.size(), 2);
        manager.blockSignals(true);
        manager.desiredInputs = {8, 9};
        manager.updateRegions();
        QCOMPARE(manager.cachedInputs, QList<int>({8, 9}));
        QCOMPARE(manager.candidates.load(), 1);
        manager.blockSignals(false);
        manager.updateRegions();
        QCOMPARE(changed.size(), 2);
        QCOMPARE(manager.candidates.load(), 1);
    }
    void isolatedFailurePaths_data()
    {
        QTest::addColumn<QByteArray>("scenario");
        for (const auto *name : {"manager-deleted-during-seal", "owner-deleted-during-seal",
                                "nested-seal-reopen", "manager-moved-during-seal",
                                "owner-moved-before-ack", "worker-moved-after-capture",
                                "owner-lost-before-invalidated-park",
                                "owner-deleted-while-parked", "manager-deleted-while-parked",
                                "owner-deleted-during-finish", "manager-deleted-during-finish"})
            QTest::newRow(name) << QByteArray(name);
    }
    void isolatedFailurePaths()
    {
        QFETCH(QByteArray, scenario);
        QProcess child;
        auto environment = QProcessEnvironment::systemEnvironment();
        environment.insert("COMPANION_ADMISSION_CASE", QString::fromLatin1(scenario));
        child.setProcessEnvironment(environment);
        child.setProcessChannelMode(QProcess::MergedChannels);
        child.start(QCoreApplication::applicationFilePath(), QStringList());
        QVERIFY2(child.waitForStarted(1000), qPrintable(child.errorString()));
        const bool finished = child.waitForFinished(4000);
        if (!finished) { child.kill(); child.waitForFinished(1000); }
        const auto output = child.readAll();
        QVERIFY2(finished, output.constData());
        QCOMPARE(child.exitStatus(), QProcess::NormalExit);
        QVERIFY2(child.exitCode() == 0, output.constData());
        QVERIFY2(output.contains("ISOLATED_ADMISSION_PASS"), output.constData());
    }
    void releaseBeforeWorkerWaitIsSafe()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        int completed = 0;
        connect(&gate, &AdmissionGate::parked, &gate, [&](int generation) {
            closeAndPublish(gate, manager, generation);
            ++completed;
        });
        for (int i = 0; i < 100; ++i) {
            QVERIFY(gate.pause(&manager, ++next));
            QTRY_COMPARE(completed, i + 1);
            QCOMPARE(gate.phase(), QString("ready"));
        }
    }
    void foreignThreadCannotChangeGate()
    {
        AdmissionGate gate; start(gate);
        PenInputSurfaceManager manager;
        std::atomic<int> accepted {-1};
        QMetaObject::invokeMethod(&worker, [&] {
            accepted.store(gate.pause(&manager, 999999) ? 1 : 0);
        }, Qt::QueuedConnection);
        QTRY_COMPARE(accepted.load(), 0);
        QCOMPARE(gate.phase(), QString("ready"));
        QVERIFY(!manager.producer.isEmpty());
    }
    void finishedInvalidatesEpoch()
    {
        AdmissionGate gate; start(gate);
        worker.quit();
        QVERIFY(worker.wait(1000));
        PenInputSurfaceManager manager;
        QVERIFY(!gate.pause(&manager, ++next));
        QVERIFY(!manager.producer.isEmpty());
    }
};
int main(int argc, char **argv)
{
    QCoreApplication app(argc, argv);
    const auto scenario = qgetenv("COMPANION_ADMISSION_CASE");
    if (!scenario.isEmpty()) isolatedCase(scenario);
    TestAdmissionGate tests;
    return QTest::qExec(&tests, argc, argv);
}
#include "tst_admissiongate.moc"
