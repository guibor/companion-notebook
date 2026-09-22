// Desktop native-QObject ordering experiment, never deployed to a tablet.
#include <QCoreApplication>
#include <QEvent>
#include <QMetaObject>
#include <QQmlComponent>
#include <QQmlContext>
#include <QQmlEngine>
#include <QtQml/qqml.h>
#include <cstdio>
#include <cstdlib>
#include <memory>

class Audit : public QObject {
    Q_OBJECT
public:
    int derived = 0, callbacks = 0, premature = 0, queued = 0, queuedPremature = 0;
    Q_INVOKABLE void note() { ++callbacks; if (derived == 0) ++premature; }
    Q_INVOKABLE void later() { ++queued; if (derived == 0) ++queuedPremature; }
};
static Audit *currentAudit;
class NativeLike : public QObject {
    Q_OBJECT
public:
    explicit NativeLike(QObject *parent = nullptr) : QObject(parent) {}
    ~NativeLike() override { ++currentAudit->derived; }
};
static void require(bool condition, const char *message) {
    if (!condition) { std::fprintf(stderr,"FAIL: %s\n",message); std::exit(1); }
}
static QObject *makeRoot(QQmlEngine &engine, Audit &audit) {
    engine.rootContext()->setContextProperty("audit", &audit);
    QQmlComponent component(&engine);
    component.setData(R"QML(
import QtQml
import CompanionLifetimeTest 1.0
QtObject {
    id: root
    property var child: null
    property Component factory: Component {
        NativeLike { Component.onDestruction: root.observeRetirement() }
    }
    Component.onCompleted: child = factory.createObject(root)
    function observeRetirement() {
        audit.note()
        // Function belongs to the surviving owner, not the dying child context.
        Qt.callLater(root.deliverAcknowledgement)
    }
    function deliverAcknowledgement() { audit.later() }
    function retire() { child.destroy(); child = null }
}
)QML", QUrl("file:///companion-retirement-test.qml"));
    if (component.isError()) qWarning() << component.errors();
    require(component.isReady(), "test component must load");
    QObject *root = component.create();
    require(root != nullptr, "test root must instantiate");
    return root;
}
static void processDeferred() {
    QCoreApplication::sendPostedEvents(nullptr,QEvent::DeferredDelete);
    QCoreApplication::processEvents();
}
int main(int argc,char **argv) {
    QCoreApplication app(argc,argv);
    qmlRegisterType<NativeLike>("CompanionLifetimeTest",1,0,"NativeLike");
    {
        Audit audit; currentAudit=&audit;
        QQmlEngine engine;
        QObject *root=makeRoot(engine,audit);
        require(QMetaObject::invokeMethod(root,"retire",Qt::DirectConnection),"retire call");
        require(audit.derived==0 && audit.callbacks==0 && audit.queued==0,"destroy() must not pretend synchronous retirement");
        processDeferred();processDeferred();
        require(audit.derived==1 && audit.callbacks==1 && audit.premature==1,"Component callback precedes the native derived destructor even for ordinary deletion");
        require(audit.queued==1 && audit.queuedPremature==0,"ordinary queued callback observed after native destruction on this tested path");
        delete root;
        std::puts("ordinary dynamic destroy: Component callback -> native derived destructor -> surviving-owner queued callback");
    }
    {
        Audit audit; currentAudit=&audit;
        auto engine=std::make_unique<QQmlEngine>();
        QObject *root=makeRoot(*engine,audit);
        engine.reset();
        processDeferred();processDeferred();
        require(audit.queued==0,"whole-engine teardown must not deliver a queued retirement acknowledgement");
        require(audit.callbacks==1 && audit.premature==1 && audit.derived==0,"engine invalidation announces attached destruction before deleting the native child");
        std::printf("engine teardown: callbacks=%d premature=%d derived=%d queued=%d\n",audit.callbacks,audit.premature,audit.derived,audit.queued);
        delete root;
        require(audit.derived==1,"native child eventually retired when its owner is deleted");
    }
    std::puts("negative boundary regression: attached callback is not native retirement; queued ordering here is not a universal queue/GC/nested-loop proof");
    return 0;
}
#include "main.moc"
