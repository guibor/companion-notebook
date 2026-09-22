#include "retirementobserver.h"

#include <QCoreApplication>
#include <QEvent>
#include <QPointer>
#include <QQmlComponent>
#include <QQmlEngine>
#include <QSignalSpy>
#include <QThread>
#include <QtTest>

#include <functional>
#include <memory>

// These are real desktop QObject lifetimes, not the proprietary native handler.
// The exact metaobject name intentionally matches the observer's acceptance gate.
struct DestructionState {
    int started = 0;
    int finished = 0;
    std::function<void()> duringDerivedDestructor;
};

class ScenePenInputHandler : public QObject
{
    Q_OBJECT
public:
    explicit ScenePenInputHandler(DestructionState *state = nullptr,
                                 QObject *parent = nullptr)
        : QObject(parent), m_state(state) {}

    ~ScenePenInputHandler() override
    {
        if (!m_state)
            return;
        ++m_state->started;
        if (m_state->duringDerivedDestructor)
            m_state->duringDerivedDestructor();
        ++m_state->finished;
    }

private:
    DestructionState *m_state;
};

class ScenePenInputHandler_QMLTYPE_17 final : public ScenePenInputHandler
{
    Q_OBJECT
public:
    using ScenePenInputHandler::ScenePenInputHandler;
};

class ScenePenInputHandlerLookalike final : public QObject
{
    Q_OBJECT
};

class TaskThread final : public QThread
{
public:
    explicit TaskThread(std::function<void()> task) : m_task(std::move(task)) {}
    ~TaskThread() override { wait(); }

protected:
    void run() override { m_task(); }

private:
    std::function<void()> m_task;
};

class RetirementObserverTest final : public QObject
{
    Q_OBJECT

    static void dispatchAcknowledgments(RetirementObserver *observer)
    {
        // Explicit delivery, without waits/sleeps or a platform event source.
        QCoreApplication::sendPostedEvents(observer, QEvent::MetaCall);
        QCoreApplication::processEvents();
    }

private slots:
    void bothSlotsAndEitherDestructionOrder_data()
    {
        QTest::addColumn<bool>("secondFirst");
        QTest::newRow("first-then-second") << false;
        QTest::newRow("second-then-first") << true;
    }

    void bothSlotsAndEitherDestructionOrder()
    {
        QFETCH(bool, secondFirst);
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        QVERIFY(retired.isValid());
        DestructionState firstState, secondState;
        auto first = std::make_unique<ScenePenInputHandler>(&firstState);
        auto second = std::make_unique<ScenePenInputHandler>(&secondState);

        QVERIFY(observer.arm(first.get(), second.get(), 7));
        QVERIFY(observer.isArmed());
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        (secondFirst ? second : first).reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        QVERIFY(observer.isArmed());
        (secondFirst ? first : second).reset();
        QCOMPARE(firstState.finished, 1);
        QCOMPARE(secondState.finished, 1);
        QCOMPARE(retired.count(), 0); // Never a direct retirement callback.
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
        QCOMPARE(retired.at(0).at(0).toInt(), 7);
        QVERIFY(!observer.isArmed());
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
    }

    void acceptsInheritedMetaobjectName()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto first = std::make_unique<ScenePenInputHandler_QMLTYPE_17>();
        auto second = std::make_unique<ScenePenInputHandler_QMLTYPE_17>();
        QVERIFY(first->inherits("ScenePenInputHandler"));
        QVERIFY(observer.arm(first.get(), second.get(), 1));
        first.reset();
        second.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
    }

    void armAndCancelNeverMutateTargets()
    {
        QObject firstParent, secondParent;
        DestructionState firstState, secondState;
        ScenePenInputHandler first(&firstState, &firstParent);
        ScenePenInputHandler second(&secondState, &secondParent);
        first.setObjectName("first-owned-handler");
        second.setObjectName("second-owned-handler");
        first.setProperty("sentinel", 123);
        second.setProperty("sentinel", 456);
        second.blockSignals(true);
        QObject firstChild(&first), secondChild(&second);
        const auto firstChildren = first.children();
        const auto secondChildren = second.children();
        RetirementObserver observer;

        QVERIFY(observer.arm(&first, &second, 2));
        observer.cancel();
        observer.cancel();
        dispatchAcknowledgments(&observer);
        QCOMPARE(firstState.started, 0);
        QCOMPARE(secondState.started, 0);
        QCOMPARE(first.parent(), &firstParent);
        QCOMPARE(second.parent(), &secondParent);
        QCOMPARE(first.objectName(), QStringLiteral("first-owned-handler"));
        QCOMPARE(second.objectName(), QStringLiteral("second-owned-handler"));
        QCOMPARE(first.property("sentinel").toInt(), 123);
        QCOMPARE(second.property("sentinel").toInt(), 456);
        QCOMPARE(first.children(), firstChildren);
        QCOMPARE(second.children(), secondChildren);
        QVERIFY(!first.signalsBlocked());
        QVERIFY(second.signalsBlocked());
        QVERIFY(!observer.isArmed());
    }

    void destroyedStillObservedWhenOtherSignalsBlocked()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        first->blockSignals(true);
        second->blockSignals(true);
        QVERIFY(observer.arm(first.get(), second.get(), 3));
        first.reset();
        second.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
    }

    void cancelInvalidatesQueuedAcknowledgment()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(first.get(), second.get(), 4));
        first.reset();
        second.reset();
        observer.cancel();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        QVERIFY(!observer.isArmed());
    }

    void rearmSameGenerationRejectsOldQueuedAcknowledgment()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto oldFirst = std::make_unique<ScenePenInputHandler>();
        auto oldSecond = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(oldFirst.get(), oldSecond.get(), 5));
        oldFirst.reset();
        oldSecond.reset();

        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(first.get(), second.get(), 5));
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        QVERIFY(observer.isArmed());
        first.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        second.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
        QCOMPARE(retired.at(0).at(0).toInt(), 5);
    }

    void rearmDisconnectsStillLivingOldTargets()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto oldFirst = std::make_unique<ScenePenInputHandler>();
        auto oldSecond = std::make_unique<ScenePenInputHandler>();
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(oldFirst.get(), oldSecond.get(), 6));
        QVERIFY(observer.arm(first.get(), second.get(), 8));
        oldFirst.reset();
        oldSecond.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        first.reset();
        second.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
        QCOMPARE(retired.at(0).at(0).toInt(), 8);
    }

    void rejectedArmInvalidatesQueuedAcknowledgment_data()
    {
        QTest::addColumn<int>("rejection");
        QTest::newRow("first-null") << 0;
        QTest::newRow("second-null") << 1;
        QTest::newRow("same-target-twice") << 2;
        QTest::newRow("wrong-first-type") << 3;
        QTest::newRow("wrong-second-type") << 4;
        QTest::newRow("zero-generation") << 5;
        QTest::newRow("negative-generation") << 6;
        QTest::newRow("name-prefix-lookalike") << 7;
    }

    void rejectedArmInvalidatesQueuedAcknowledgment()
    {
        QFETCH(int, rejection);
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto oldFirst = std::make_unique<ScenePenInputHandler>();
        auto oldSecond = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(oldFirst.get(), oldSecond.get(), 9));
        oldFirst.reset();
        oldSecond.reset();

        ScenePenInputHandler first, second;
        QObject wrong;
        wrong.setObjectName("ScenePenInputHandler");
        ScenePenInputHandlerLookalike lookalike;
        QObject *a = &first, *b = &second;
        int generation = 9;
        switch (rejection) {
        case 0: a = nullptr; break;
        case 1: b = nullptr; break;
        case 2: b = a; break;
        case 3: a = &wrong; break;
        case 4: b = &wrong; break;
        case 5: generation = 0; break;
        case 6: generation = -1; break;
        case 7: a = &lookalike; break;
        }
        QVERIFY(!observer.arm(a, b, generation));
        QVERIFY(!observer.isArmed());
        QVERIFY(!observer.lastError().isEmpty());
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        QVERIFY(observer.arm(&first, &second, 10));
        QVERIFY(observer.lastError().isEmpty());
        observer.cancel();
    }

    void rejectsObserverOwnedByEitherTarget_data()
    {
        QTest::addColumn<bool>("underSecond");
        QTest::addColumn<bool>("indirect");
        QTest::newRow("first-direct") << false << false;
        QTest::newRow("second-direct") << true << false;
        QTest::newRow("first-ancestor") << false << true;
        QTest::newRow("second-ancestor") << true << true;
    }

    void rejectsObserverOwnedByEitherTarget()
    {
        QFETCH(bool, underSecond);
        QFETCH(bool, indirect);
        ScenePenInputHandler first, second;
        QObject *parent = underSecond ? &second : &first;
        if (indirect)
            parent = new QObject(parent);
        auto *observer = new RetirementObserver(parent);
        QVERIFY(!observer->arm(&first, &second, 11));
        QVERIFY(!observer->isArmed());
        QVERIFY(!observer->lastError().isEmpty());
    }

    void rejectsTargetThreadMismatch_data()
    {
        QTest::addColumn<bool>("secondMoved");
        QTest::newRow("first-target") << false;
        QTest::newRow("second-target") << true;
    }

    void rejectsTargetThreadMismatch()
    {
        QFETCH(bool, secondMoved);
        RetirementObserver observer;
        ScenePenInputHandler local;
        auto *foreign = new ScenePenInputHandler;
        TaskThread worker([foreign] { delete foreign; });
        QVERIFY(foreign->moveToThread(&worker));
        QVERIFY(!observer.arm(secondMoved ? &local : foreign,
                              secondMoved ? foreign : &local, 12));
        QVERIFY(!observer.isArmed());
        QVERIFY(!observer.lastError().isEmpty());
        worker.start();
        QVERIFY(worker.wait(5000)); // Join, not a timing-based success condition.
    }

    void rejectsObserverThreadMismatch()
    {
        auto *observer = new RetirementObserver;
        ScenePenInputHandler first, second;
        TaskThread worker([observer] { delete observer; });
        QVERIFY(observer->moveToThread(&worker));
        QVERIFY(!observer->arm(&first, &second, 13));
        QVERIFY(!observer->isArmed());
        QVERIFY(!observer->lastError().isEmpty());
        worker.start();
        QVERIFY(worker.wait(5000));
    }

    void observerThreadChangeRevokesPendingAcknowledgment()
    {
        auto observer = std::make_unique<RetirementObserver>();
        QSignalSpy retired(observer.get(), &RetirementObserver::retired);
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer->arm(first.get(), second.get(), 22));
        first.reset();
        second.reset();
        bool returnedToUi = false;
        TaskThread worker([&] {
            returnedToUi = observer->moveToThread(QCoreApplication::instance()->thread());
        });
        QVERIFY(observer->moveToThread(&worker));
        worker.start();
        QVERIFY(worker.wait(5000));
        QVERIFY(returnedToUi);
        QVERIFY(!observer->isArmed());
        dispatchAcknowledgments(observer.get());
        QCOMPARE(retired.count(), 0);
    }

    void postArmForeignTargetDestructionCannotAcknowledge()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto *first = new ScenePenInputHandler;
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(first, second.get(), 23));
        TaskThread worker([first] { delete first; });
        QVERIFY(first->moveToThread(&worker));
        second.reset();
        worker.start();
        QVERIFY(worker.wait(5000));
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 0);
        observer.cancel();
    }

    void wrongCallerThreadCannotMutateLiveUiObservation()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        auto oldFirst = std::make_unique<ScenePenInputHandler>();
        auto oldSecond = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer.arm(oldFirst.get(), oldSecond.get(), 14));
        oldFirst.reset();
        oldSecond.reset();
        ScenePenInputHandler first, second;
        bool accepted = true;
        QString foreignError;
        // The UI thread joins the worker, so there is no concurrent state access.
        TaskThread worker([&] {
            accepted = observer.arm(&first, &second, 14);
            observer.cancel();
            foreignError = observer.lastError();
        });
        worker.start();
        QVERIFY(worker.wait(5000));
        QVERIFY(!accepted);
        QCOMPARE(foreignError, QStringLiteral("not-on-ui-thread"));
        QVERIFY(observer.isArmed());
        QVERIFY(observer.lastError().isEmpty());
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
        QCOMPARE(retired.at(0).at(0).toInt(), 14);
    }

    void observerDeathCancelsQueuedAcknowledgment()
    {
        auto observer = std::make_unique<RetirementObserver>();
        QObject receiver;
        int acknowledgments = 0;
        connect(observer.get(), &RetirementObserver::retired, &receiver,
                [&](int) { ++acknowledgments; });
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        QVERIFY(observer->arm(first.get(), second.get(), 15));
        first.reset();
        second.reset();
        observer.reset();
        QCoreApplication::sendPostedEvents(nullptr, QEvent::MetaCall);
        QCoreApplication::processEvents();
        QCOMPARE(acknowledgments, 0);
    }

    void observerDeathDoesNotOwnOrDeleteTargets()
    {
        auto observer = std::make_unique<RetirementObserver>();
        DestructionState firstState, secondState;
        auto first = std::make_unique<ScenePenInputHandler>(&firstState);
        auto second = std::make_unique<ScenePenInputHandler>(&secondState);
        QVERIFY(observer->arm(first.get(), second.get(), 16));
        observer.reset();
        QCOMPARE(firstState.started, 0);
        QCOMPARE(secondState.started, 0);
        first.reset();
        second.reset();
        QCOMPARE(firstState.finished, 1);
        QCOMPARE(secondState.finished, 1);
        QCoreApplication::sendPostedEvents(nullptr, QEvent::MetaCall);
    }

    void derivedDestructorEventPumpingCannotRetireEarly()
    {
        RetirementObserver observer;
        QSignalSpy retired(&observer, &RetirementObserver::retired);
        DestructionState firstState, secondState;
        auto first = std::make_unique<ScenePenInputHandler>(&firstState);
        auto second = std::make_unique<ScenePenInputHandler>(&secondState);
        int duringDestructorCount = -1;
        secondState.duringDerivedDestructor = [&] {
            dispatchAcknowledgments(&observer);
            duringDestructorCount = retired.count();
        };
        QVERIFY(observer.arm(first.get(), second.get(), 17));
        first.reset();
        second.reset();
        QCOMPARE(duringDestructorCount, 0);
        QCOMPARE(secondState.finished, 1);
        dispatchAcknowledgments(&observer);
        QCOMPARE(retired.count(), 1);
    }

    void retirementListenerCanRearmSynchronously()
    {
        RetirementObserver observer;
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        auto nextFirst = std::make_unique<ScenePenInputHandler>();
        auto nextSecond = std::make_unique<ScenePenInputHandler>();
        QList<int> generations;
        bool rearmed = false;
        connect(&observer, &RetirementObserver::retired, this, [&](int generation) {
            generations.append(generation);
            if (generation == 19)
                rearmed = observer.arm(nextFirst.get(), nextSecond.get(), 20);
        });
        QVERIFY(observer.arm(first.get(), second.get(), 19));
        first.reset();
        second.reset();
        dispatchAcknowledgments(&observer);
        QVERIFY(rearmed);
        QVERIFY(observer.isArmed());
        QCOMPARE(generations, QList<int>{19});
        nextFirst.reset();
        nextSecond.reset();
        dispatchAcknowledgments(&observer);
        QCOMPARE(generations, (QList<int>{19, 20}));
        QVERIFY(!observer.isArmed());
    }

    void retirementListenerCanDeleteObserverSynchronously()
    {
        auto *observer = new RetirementObserver;
        QPointer<RetirementObserver> guard(observer);
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        int acknowledgments = 0;
        connect(observer, &RetirementObserver::retired, this, [&](int generation) {
            QCOMPARE(generation, 21);
            ++acknowledgments;
            delete observer;
        });
        QVERIFY(observer->arm(first.get(), second.get(), 21));
        first.reset();
        second.reset();
        dispatchAcknowledgments(observer);
        QCOMPARE(acknowledgments, 1);
        QVERIFY(guard.isNull());
        QCoreApplication::sendPostedEvents(nullptr, QEvent::MetaCall);
        QCOMPARE(acknowledgments, 1);
    }

    void nestedQObjectDestructionShowsNarrowDerivedRetirementContract()
    {
        RetirementObserver observer;
        DestructionState firstState, secondState;
        auto first = std::make_unique<ScenePenInputHandler>(&firstState);
        auto second = std::make_unique<ScenePenInputHandler>(&secondState);
        QPointer<QObject> secondChild(new QObject(second.get()));
        bool insideQObjectDestroyedSignal = false;
        bool acknowledgedInsideBaseDestruction = false;
        bool derivedDestructorsComplete = false;
        int acknowledgments = 0;
        connect(&observer, &RetirementObserver::retired, this, [&](int generation) {
            ++acknowledgments;
            QCOMPARE(generation, 18);
            derivedDestructorsComplete = firstState.finished == 1 && secondState.finished == 1;
            acknowledgedInsideBaseDestruction = insideQObjectDestroyedSignal && !secondChild.isNull();
        });
        QVERIFY(observer.arm(first.get(), second.get(), 18));
        // Connected after arm: the observer queues first; this later direct
        // listener deliberately dispatches it before QObject deletes children.
        connect(second.get(), &QObject::destroyed, this, [&] {
            insideQObjectDestroyedSignal = true;
            dispatchAcknowledgments(&observer);
            insideQObjectDestroyedSignal = false;
        }, Qt::DirectConnection);
        first.reset();
        second.reset();
        QCOMPARE(acknowledgments, 1);
        QVERIFY(derivedDestructorsComplete);
        QVERIFY(acknowledgedInsideBaseDestruction);
        QVERIFY(secondChild.isNull());
        dispatchAcknowledgments(&observer);
        QCOMPARE(acknowledgments, 1);
    }

    void actualBuiltQmlPluginImportsAndObserves()
    {
        QQmlEngine engine;
        engine.addImportPath(QString::fromUtf8(TEST_OBSERVER_IMPORT_DIR));
        QQmlComponent component(&engine);
        component.setData(
            "import QtQml\nimport Companion.Lifecycle 1.0\nRetirementObserver {}\n",
            QUrl(QStringLiteral("file:///native-observer-import-test.qml")));
        QVERIFY2(component.isReady(), qPrintable(component.errorString()));
        std::unique_ptr<QObject> observer(component.create());
        QVERIFY2(observer, qPrintable(component.errorString()));
        // No qmlRegisterType call occurs in this test. This object must come
        // through the actual built module's qmldir and plugin entry point.
        QSignalSpy retired(observer.get(), SIGNAL(retired(int)));
        QVERIFY(retired.isValid());
        auto first = std::make_unique<ScenePenInputHandler>();
        auto second = std::make_unique<ScenePenInputHandler>();
        bool accepted = false;
        QVERIFY(QMetaObject::invokeMethod(observer.get(), "arm", Qt::DirectConnection,
                                         Q_RETURN_ARG(bool, accepted),
                                         Q_ARG(QObject *, first.get()),
                                         Q_ARG(QObject *, second.get()),
                                         Q_ARG(int, 24)));
        QVERIFY(accepted);
        first.reset();
        QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
        QCOMPARE(retired.count(), 0);
        second.reset();
        QCOMPARE(retired.count(), 0);
        QCoreApplication::sendPostedEvents(observer.get(), QEvent::MetaCall);
        QCOMPARE(retired.count(), 1);
        QCOMPARE(retired.at(0).at(0).toInt(), 24);
    }
};

QTEST_GUILESS_MAIN(RetirementObserverTest)
#include "tst_retirementobserver.moc"
