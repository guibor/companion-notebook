#include "retirementobserver.h"

#include <QCoreApplication>
#include <QEvent>
#include <QPointer>
#include <QScopedValueRollback>
#include <QScopeGuard>
#include <QThread>
#include <limits>

RetirementObserver::RetirementObserver(QObject *parent) : QObject(parent) {}

RetirementObserver::~RetirementObserver()
{
    // QObject also removes context-bound pending calls. Invalidate first so no
    // stale epoch can become eligible during any later QObject teardown work.
    m_destroying = true;
    invalidate();
}

bool RetirementObserver::onUiThread() const
{
    const auto *app = QCoreApplication::instance();
    return app && thread() == app->thread()
        && QThread::currentThread() == app->thread();
}

bool RetirementObserver::ownsObserver(const QObject *target) const
{
    for (const QObject *owner = this; owner; owner = owner->parent()) {
        if (owner == target)
            return true;
    }
    return false;
}

void RetirementObserver::disconnectTargets()
{
    // Disconnect notifications can be reentrant. Remove ownership of the old
    // connections before invoking any target-side notification.
    const auto connections = m_connections;
    m_connections = {};
    for (const auto &connection : connections) {
        QObject::disconnect(connection);
    }
}

bool RetirementObserver::invalidate()
{
    m_armed = false;
    m_acknowledgementPosted = false;
    m_generation = 0;
    m_observedMask = 0;
    const bool hasNextEpoch = m_epoch != std::numeric_limits<quint64>::max();
    if (hasNextEpoch)
        ++m_epoch;
    disconnectTargets();
    if (!hasNextEpoch) {
        m_lastError = QStringLiteral("epoch-exhausted");
        return false;
    }
    return true;
}

bool RetirementObserver::refuse(const QString &reason)
{
    invalidate();
    m_lastError = reason;
    return false;
}

bool RetirementObserver::arm(QObject *first, QObject *second, int generation)
{
    // Do not read/write our mutable state from an unsupported calling thread.
    // QML calls are UI-thread calls; a foreign-thread caller gets no authority
    // to cancel/rearm a live UI-thread observation.
    if (!onUiThread())
        return false;
    if (m_destroying)
        return false;
    if (m_mutating) {
        m_cancelRequested = true;
        return false;
    }
    QScopedValueRollback<bool> mutationGuard(m_mutating, true);
    m_cancelRequested = false;

    if (!invalidate())
        return false;
    m_lastError.clear();
    if (generation <= 0)
        return refuse(QStringLiteral("invalid-generation"));
    if (!first || !second)
        return refuse(QStringLiteral("null-target"));
    if (first == second)
        return refuse(QStringLiteral("duplicate-target"));

    auto *uiThread = QCoreApplication::instance()->thread();
    for (const QObject *target : {first, second}) {
        if (target->thread() != uiThread)
            return refuse(QStringLiteral("target-not-on-ui-thread"));
        // QML-generated subclasses are allowed; no proprietary C++ type,
        // private Qt interface, hard-coded address, or target cast is used.
        if (!target->inherits("ScenePenInputHandler"))
            return refuse(QStringLiteral("wrong-target-class"));
        if (ownsObserver(target))
            return refuse(QStringLiteral("target-owns-observer"));
    }

    const std::array<QPointer<QObject>, 2> guards = {first, second};
    const std::array<QObject *, 2> targets = {first, second};
    const quint64 epoch = m_epoch;
    std::array<QMetaObject::Connection, 2> pending;
    const auto pendingCleanup = qScopeGuard([&pending] {
        for (const auto &connection : pending)
            QObject::disconnect(connection);
    });
    for (unsigned slot = 0; slot != targets.size(); ++slot) {
        pending[slot] = QObject::connect(
            targets[slot], &QObject::destroyed, this,
            [this, epoch, slot, uiThread](QObject *) {
                // Captures carry identity; the dying sender is never inspected.
                // An illegal later target move must not run our state machine
                // on a worker thread or produce a retirement acknowledgement.
                if (QThread::currentThread() != uiThread)
                    return;
                observed(epoch, slot);
            }, Qt::DirectConnection);
        if (!pending[slot])
            return refuse(QStringLiteral("connection-failed"));
        // A custom connectNotify could reenter; never accept a partial arm whose
        // targets vanished while their connections were being installed.
        if (!guards[0] || !guards[1])
            return refuse(QStringLiteral("target-lost-during-arm"));
        if (m_cancelRequested || epoch != m_epoch)
            return refuse(QStringLiteral("reentrant-operation"));
    }
    m_connections = pending;
    pending = {};
    m_generation = generation;
    m_armed = true;
    return true;
}

void RetirementObserver::cancel()
{
    if (!onUiThread())
        return;
    if (m_destroying)
        return;
    if (m_mutating) {
        m_cancelRequested = true;
        return;
    }
    QScopedValueRollback<bool> mutationGuard(m_mutating, true);
    if (invalidate())
        m_lastError.clear();
}

bool RetirementObserver::isArmed() const
{
    return onUiThread() && m_armed;
}

QString RetirementObserver::lastError() const
{
    return onUiThread() ? m_lastError : QStringLiteral("not-on-ui-thread");
}

bool RetirementObserver::event(QEvent *event)
{
    // QObject delivers ThreadChange before migration, on the old owning thread.
    // The observer is a UI-only object; moving it revokes its current epoch.
    if (event->type() == QEvent::ThreadChange)
        invalidate();
    return QObject::event(event);
}

void RetirementObserver::observed(quint64 epoch, unsigned slot)
{
    if (!onUiThread() || !m_armed || epoch != m_epoch || slot > 1)
        return;
    const unsigned bit = 1u << slot;
    if (m_observedMask & bit)
        return;
    m_observedMask |= bit;
    if (m_observedMask != 3u || m_acknowledgementPosted)
        return;

    m_acknowledgementPosted = true;
    const int generation = m_generation;
    if (!QMetaObject::invokeMethod(this, [this, epoch, generation] {
            acknowledge(epoch, generation);
        }, Qt::QueuedConnection)) {
        refuse(QStringLiteral("acknowledgement-post-failed"));
    }
}

void RetirementObserver::acknowledge(quint64 epoch, int generation)
{
    if (!onUiThread() || !m_armed || !m_acknowledgementPosted
        || epoch != m_epoch || generation != m_generation || m_observedMask != 3u)
        return;

    // Retire our state before emitting, since a receiver may rearm, cancel, or
    // delete this observer synchronously. Do not touch members after the signal.
    m_armed = false;
    m_acknowledgementPosted = false;
    m_observedMask = 0;
    m_generation = 0;
    disconnectTargets();
    if (epoch != m_epoch)
        return;
    emit retired(generation);
}
