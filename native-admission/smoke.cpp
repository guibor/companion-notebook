// Standalone Linux ABI smoke. Fake thread/manager only: no Quick, display,
// xochitl, notebook, input device, service changes or network operations.
#include <QCoreApplication>
#include <QFileInfo>
#include <QList>
#include <QMetaObject>
#include <QObject>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QRegion>
#include <QThread>
#include <QTimer>
#include <QVariant>
#include <QProcess>
#include <atomic>
#include <cstdio>
#include <dlfcn.h>
#include <signal.h>
#include <unistd.h>

static void require(bool condition, const char *why)
{
    if (!condition) { std::fprintf(stderr, "ADMISSION_SMOKE_FAIL: %s\n", why); _exit(1); }
}
class PenInputThread : public QThread { Q_OBJECT };
class PenInputSurfaceManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(QRegion region READ region NOTIFY regionChanged)
public:
    QRegion current {0, 0, 100, 100};
    QRegion desired {0, 0, 100, 100};
    QRegion producer {0, 0, 100, 100};
    std::atomic<int> candidates {1};
    QList<int> cachedInputs {1};
    QList<int> desiredInputs {1};
    int cachedGeometryRevision = 0;
    int desiredGeometryRevision = 0;
    QRegion region() const { return current; }
    PenInputSurfaceManager()
    {
        connect(this, &PenInputSurfaceManager::regionChanged, this,
            [this](QRegion value) { producer = value; }, Qt::DirectConnection);
        connect(this, &PenInputSurfaceManager::activeInputsChanged, this,
            [this](const QList<int> &inputs) { candidates.store(int(inputs.size())); }, Qt::DirectConnection);
    }
    Q_INVOKABLE void updateRegions()
    {
        if (current != desired) { current = desired; emit regionChanged(current); }
        // Native caches change even with signals blocked. The worker receives
        // a publication when identities or handler geometry change, even at the
        // same list length. Global producer-region changes alone do not publish.
        const bool inputsChanged = cachedInputs != desiredInputs
            || cachedGeometryRevision != desiredGeometryRevision;
        cachedInputs = desiredInputs;
        cachedGeometryRevision = desiredGeometryRevision;
        if (inputsChanged) emit activeInputsChanged(cachedInputs);
    }
signals:
    void regionChanged(QRegion region);
    void activeInputsChanged(QList<int> inputs);
};
class Smoke : public QObject {
    Q_OBJECT
public:
    QObject *gate = nullptr;
    PenInputThread worker;
    PenInputSurfaceManager manager;
    bool earlierSubmission = false;
    bool passed = false;
    bool invoke(const char *method, int generation)
    {
        bool result = false;
        require(QMetaObject::invokeMethod(gate, method, Qt::DirectConnection,
            Q_RETURN_ARG(bool, result), Q_ARG(int, generation)), "method ABI");
        return result;
    }
public slots:
    void ready()
    {
        require(QMetaObject::invokeMethod(&worker, [this] {
            QMetaObject::invokeMethod(this, [this] { earlierSubmission = true; }, Qt::QueuedConnection);
        }, Qt::QueuedConnection), "prior worker event");
        bool accepted = false;
        require(QMetaObject::invokeMethod(gate, "pause", Qt::DirectConnection,
            Q_RETURN_ARG(bool, accepted), Q_ARG(QObject *, &manager), Q_ARG(int, 61)) && accepted,
            "seal and queue park");
        require(manager.producer.isEmpty() && manager.signalsBlocked(), "producer sealed synchronously");
    }
    void parked(int generation)
    {
        require(generation == 61 && earlierSubmission, "FIFO prior UI submission");
        require(!invoke("finish", 61), "no premature finish");
        require(!invoke("permitPublication", 61), "nonempty cache refused");
        manager.desired = {};
        manager.desiredInputs.clear();
        manager.updateRegions();
        require(manager.producer.isEmpty(), "blocked detach stays sealed");
        require(manager.cachedInputs.isEmpty() && manager.candidates.load() == 1,
            "blocked detach changes cache without publishing worker candidates");
        require(!invoke("permitPublication", 62), "stale generation refused");
        require(invoke("permitPublication", 61), "empty cache allows final publication");
        require(!invoke("finish", 61), "unchanged empty cache cannot release without candidate publication");
        require(manager.candidates.load() == 1, "unchanged refresh does not republish stale candidates");
        manager.desired = QRegion(0, 100, 100, 200);
        manager.desiredInputs = {2, 3};
        manager.desiredGeometryRevision = 1;
        manager.updateRegions();
        require(QMetaObject::invokeMethod(&worker, [this] {
            require(manager.candidates == 2, "fresh candidates before worker resumes");
            QMetaObject::invokeMethod(this, [this] {
                passed = true;
                QCoreApplication::quit();
            }, Qt::QueuedConnection);
        }, Qt::QueuedConnection), "post-publication work");
        require(invoke("finish", 61), "generation checked release");
        require(!invoke("finish", 61), "duplicate finish refused");
    }
};
int main(int argc, char **argv)
{
    struct sigaction action {};
    action.sa_handler = SIG_DFL;
    sigemptyset(&action.sa_mask);
    sigset_t unblocked; sigemptyset(&unblocked); sigaddset(&unblocked, SIGALRM);
    require(sigaction(SIGALRM, &action, nullptr) == 0
        && sigprocmask(SIG_UNBLOCK, &unblocked, nullptr) == 0, "hard deadline");
    alarm(5);
    require(argc == 1, "no arguments accepted");
    QCoreApplication app(argc, argv);
    const auto bootstrap = app.applicationDirPath() + "/libcompanionbootstrap.so";
    void *symbol = dlsym(RTLD_DEFAULT, "_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE");
    Dl_info info {};
    require(symbol && dladdr(symbol, &info) && info.dli_fname
        && QFileInfo(QString::fromLocal8Bit(info.dli_fname)).canonicalFilePath()
            == QFileInfo(bootstrap).canonicalFilePath(), "exact bootstrap symbol binding");
    char actualExe[4096];
    const auto exeLength = readlink("/proc/self/exe", actualExe, sizeof(actualExe) - 1);
    require(exeLength > 0 && exeLength < static_cast<ssize_t>(sizeof(actualExe) - 1), "kernel executable path");
    actualExe[exeLength] = 0;
    require(QFileInfo(QString::fromLocal8Bit(actualExe)).canonicalFilePath()
        == QFileInfo(app.applicationFilePath()).canonicalFilePath(), "native executable identity preserved");
    QProcess child;
    child.setProgram(app.applicationDirPath() + "/admission-preload-child");
    child.start();
    require(child.waitForStarted(500) && child.waitForFinished(1000), "bounded non-Qt child");
    require(child.exitStatus() == QProcess::NormalExit && child.exitCode() == 0
        && child.readAllStandardOutput() == "6\n" && child.readAllStandardError().isEmpty(),
        "exec child preserves numeric stdout without Qt/admission inheritance");
    Smoke smoke;
    smoke.worker.start();
    require(smoke.worker.moveToThread(&smoke.worker), "actual public self-move");
    QQmlEngine engine;
    engine.setImportPathList({app.applicationDirPath() + "/qml"});
    QQmlComponent component(&engine);
    component.setData("import Companion.Admission 1.0\nAdmissionGate {}\n", QUrl("qrc:/admission-smoke.qml"));
    if (!component.isReady())
        for (const auto &error : component.errors()) qWarning().noquote() << error.toString();
    require(component.isReady(), "QML import same resident DSO");
    smoke.gate = component.create();
    require(smoke.gate, "QML gate creation");
    require(QObject::connect(smoke.gate, SIGNAL(ready()), &smoke, SLOT(ready())), "ready signal ABI");
    require(QObject::connect(smoke.gate, SIGNAL(parked(int)), &smoke, SLOT(parked(int))), "park signal ABI");
    bool accepted = false;
    require(QMetaObject::invokeMethod(smoke.gate, "initialize", Qt::DirectConnection,
        Q_RETURN_ARG(bool, accepted)) && accepted, "cold registry shared with QML plugin");
    app.exec();
    require(smoke.passed, "end-to-end fake worker result");
    smoke.worker.quit();
    require(smoke.worker.wait(500), "worker clean exit");
    delete smoke.gate;
    std::puts("ADMISSION_SMOKE_PASS: Qt-free exec child, preserved executable identity, actual bootstrap ABI, one shared registry, cold worker roundtrip, sealed FIFO park, final candidates then release; fake objects only");
    alarm(0);
    return 0;
}
#include "smoke.moc"
