#include "retirementobserver.h"

#include <QQmlExtensionPlugin>
#include <QtQml/qqml.h>

class CompanionLifecyclePlugin : public QQmlExtensionPlugin {
    Q_OBJECT
    Q_PLUGIN_METADATA(IID QQmlExtensionInterface_iid)
public:
    void registerTypes(const char *uri) override
    {
        if (QByteArray(uri) != QByteArrayLiteral("Companion.Lifecycle")) {
            qWarning("Companion lifecycle plugin imported with an unexpected URI");
            return;
        }
        qmlRegisterType<RetirementObserver>(uri, 1, 0, "RetirementObserver");
    }
};

#include "plugin.moc"
