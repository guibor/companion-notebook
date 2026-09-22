#pragma once

#include <QObject>
#include <QRegion>
#include <memory>

class QThread;
struct AdmissionPark;
struct AdmissionCallState;

// Called only after the original public Qt self-move returned successfully.
// This records identity; it does not announce native construction/readiness.
void companionObserveSelfMove(QObject *object, QThread *target, bool succeeded);

class AdmissionGate : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString phase READ phase NOTIFY phaseChanged)
    Q_PROPERTY(QString error READ error NOTIFY phaseChanged)
public:
    explicit AdmissionGate(QObject *parent = nullptr);
    ~AdmissionGate() override;
    QString phase() const { return m_phase; }
    QString error() const { return m_error; }
    Q_INVOKABLE bool initialize();
    Q_INVOKABLE bool pause(QObject *manager, int generation);
    Q_INVOKABLE bool permitPublication(int generation);
    Q_INVOKABLE bool finish(int generation);
signals:
    void phaseChanged();
    void ready();
    void parked(int generation);
    void resumed(int generation);
protected:
    bool event(QEvent *event) override;
private slots:
    void observeRegion(QRegion region);
    void observeInputs();
private:
    bool onUi() const;
    bool refuse(const QString &reason);
    void setPhase(const QString &phase);
    QString m_phase = QStringLiteral("cold");
    QString m_error;
    quint64 m_epoch = 0;
    int m_generation = 0;
    std::shared_ptr<AdmissionCallState> m_call;
    std::shared_ptr<AdmissionPark> m_park;
};
