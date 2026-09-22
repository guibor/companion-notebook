// Standalone ABI/import smoke test. No xochitl, QtQuick, display, input device,
// real handler, notebook, network, or service access. Never a native-ink test.
#include <QCoreApplication>
#include <QEvent>
#include <QMetaObject>
#include <QObject>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QStringList>
#include <QUrl>

#include <cstdio>
#include <memory>
#include <signal.h>
#include <unistd.h>

struct SmokeState {
    unsigned finishedMask = 0;
    unsigned maskAtAcknowledgement = 0;
    int acknowledgements = 0;
    int generation = 0;
};

// This metaobject name deliberately exercises the plugin's public type gate.
// It is a local fake, not the tablet's proprietary ScenePenInputHandler.
class ScenePenInputHandler : public QObject {
    Q_OBJECT
public:
    ScenePenInputHandler(SmokeState &state, unsigned slot)
        : m_state(state), m_slot(slot) {}
    ~ScenePenInputHandler() override { m_state.finishedMask |= 1u << m_slot; }

private:
    SmokeState &m_state;
    const unsigned m_slot;
};

class SmokeReceiver : public QObject {
    Q_OBJECT
public:
    explicit SmokeReceiver(SmokeState &state) : m_state(state) {}

public Q_SLOTS:
    void acknowledge(int generation)
    {
        ++m_state.acknowledgements;
        m_state.generation = generation;
        m_state.maskAtAcknowledgement = m_state.finishedMask;
    }

private:
    SmokeState &m_state;
};

static bool require(bool condition, const char *message)
{
    if (!condition)
        std::fprintf(stderr, "OBSERVER_SMOKE_FAIL: %s\n", message);
    return condition;
}

static bool queryArmed(QObject *observer, bool expected)
{
    bool armed = !expected;
    return QMetaObject::invokeMethod(observer, "isArmed", Qt::DirectConnection,
                                    Q_RETURN_ARG(bool, armed)) && armed == expected;
}

static bool runSmoke(int &argc, char **argv)
{
    QCoreApplication app(argc, argv);
    QQmlEngine engine;
    // Do not search user QML paths or accept an arbitrary module path argument.
    engine.setImportPathList({QCoreApplication::applicationDirPath() + "/qml"});
    QQmlComponent component(&engine);
    component.setData("import Companion.Lifecycle 1.0\nRetirementObserver {}\n",
                      QUrl(QStringLiteral("qrc:/companion-observer-smoke.qml")));
    if (!component.isReady()) {
        for (const auto &error : component.errors())
            std::fprintf(stderr, "OBSERVER_SMOKE_IMPORT: %s\n",
                         error.toString().toUtf8().constData());
        return require(false, "local QML plugin must load synchronously");
    }
    std::unique_ptr<QObject> observer(component.create());
    if (!require(bool(observer), "RetirementObserver must instantiate"))
        return false;

    SmokeState state;
    SmokeReceiver receiver(state);
    auto first = std::make_unique<ScenePenInputHandler>(state, 0);
    auto second = std::make_unique<ScenePenInputHandler>(state, 1);
    if (!require(bool(QObject::connect(observer.get(), SIGNAL(retired(int)),
                                       &receiver, SLOT(acknowledge(int)),
                                       Qt::DirectConnection)),
                 "plugin retirement signal must connect"))
        return false;

    bool accepted = false;
    const bool invoked = QMetaObject::invokeMethod(
        observer.get(), "arm", Qt::DirectConnection, Q_RETURN_ARG(bool, accepted),
        Q_ARG(QObject *, first.get()), Q_ARG(QObject *, second.get()), Q_ARG(int, 41));
    if (!require(invoked && accepted && queryArmed(observer.get(), true),
                 "plugin must arm both local fake handlers"))
        return false;
    QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
    if (!require(state.acknowledgements == 0, "no acknowledgement while targets live"))
        return false;

    first.reset();
    QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
    if (!require(state.finishedMask == 1 && state.acknowledgements == 0,
                 "one retired target must not acknowledge the pair"))
        return false;
    second.reset();
    if (!require(state.finishedMask == 3 && state.acknowledgements == 0,
                 "acknowledgement must be queued, never direct"))
        return false;
    QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
    if (!require(state.acknowledgements == 1 && state.generation == 41
                 && state.maskAtAcknowledgement == 3 && queryArmed(observer.get(), false),
                 "both derived retirements must produce one matching acknowledgement"))
        return false;
    QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
    return require(state.acknowledgements == 1, "acknowledgement must not duplicate");
}

int main(int argc, char **argv)
{
    // A timer in the same event loop would not bound a hung import or destructor.
    // Default, unblocked SIGALRM gives this Linux/macOS helper a five-second
    // process deadline, including Qt construction and all teardown after checks.
    struct sigaction action {};
    action.sa_handler = SIG_DFL;
    sigemptyset(&action.sa_mask);
    sigset_t unblocked;
    sigemptyset(&unblocked);
    sigaddset(&unblocked, SIGALRM);
    if (sigaction(SIGALRM, &action, nullptr) != 0
        || sigprocmask(SIG_UNBLOCK, &unblocked, nullptr) != 0) {
        std::fputs("OBSERVER_SMOKE_FAIL: cannot establish hard deadline\n", stderr);
        return 1;
    }
    alarm(5);
    if (argc != 1) {
        std::fputs("OBSERVER_SMOKE_FAIL: no arguments accepted\n", stderr);
        return 1;
    }
    const bool passed = runSmoke(argc, argv);
    alarm(0);
    if (!passed)
        return 1;
    std::puts("OBSERVER_SMOKE_PASS: local module import, two fake native retirements, one queued generation=41 acknowledgement; no native-ink qualification");
    return 0;
}

#include "smoke.moc"
