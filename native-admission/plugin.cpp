#include "admissiongate.h"
#include <QQmlExtensionPlugin>
#include <QtQml/qqml.h>

extern "C" __attribute__((visibility("default"))) void companion_admission_observe_v1(
    QObject *object, QThread *target, bool succeeded)
{
    companionObserveSelfMove(object, target, succeeded);
}

class CompanionAdmissionPlugin : public QQmlExtensionPlugin {
    Q_OBJECT
    Q_PLUGIN_METADATA(IID QQmlExtensionInterface_iid)
public:
    void registerTypes(const char *uri) override
    {
        if (QByteArray(uri) == QByteArrayLiteral("Companion.Admission"))
            qmlRegisterType<AdmissionGate>(uri, 1, 0, "AdmissionGate");
    }
};
#include "plugin.moc"
