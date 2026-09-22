#pragma once

#include <QMetaObject>
#include <QObject>
#include <QString>
#include <QtGlobal>
#include <array>

// Observes destruction; never deletes, changes, or inspects a dying target.
// All public calls belong on the application UI thread. A successful signal
// proves native derived-handler retirement, not saving or input-queue drainage.
class RetirementObserver : public QObject {
    Q_OBJECT
public:
    explicit RetirementObserver(QObject *parent = nullptr);
    ~RetirementObserver() override;

    Q_INVOKABLE bool arm(QObject *first, QObject *second, int generation);
    Q_INVOKABLE void cancel();
    Q_INVOKABLE bool isArmed() const;
    Q_INVOKABLE QString lastError() const;

Q_SIGNALS:
    void retired(int generation);

protected:
    bool event(QEvent *event) override;

private:
    bool onUiThread() const;
    bool ownsObserver(const QObject *target) const;
    bool invalidate();
    bool refuse(const QString &reason);
    void observed(quint64 epoch, unsigned slot);
    void acknowledge(quint64 epoch, int generation);
    void disconnectTargets();

    std::array<QMetaObject::Connection, 2> m_connections;
    quint64 m_epoch = 0;
    int m_generation = 0;
    unsigned m_observedMask = 0;
    bool m_armed = false;
    bool m_acknowledgementPosted = false;
    bool m_mutating = false;
    bool m_cancelRequested = false;
    bool m_destroying = false;
    QString m_lastError;
};
