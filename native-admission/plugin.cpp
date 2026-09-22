#include "admissiongate.h"
#include <QQmlExtensionPlugin>
#include <QtQml/qqml.h>

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
