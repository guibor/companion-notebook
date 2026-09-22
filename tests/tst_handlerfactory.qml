import QtQuick
import QtTest

// Original minimal desktop fixture, not a copy of a firmware handler.
// Exercises real QML creation-context lookup, not native pen, worker, or save
// behavior. Both declaration owners stay alive throughout every test.
Item {
    id: fixture
    width: 400
    height: 400

    Component {
        id: controllerFactory
        QtObject {
            id: sentinel
            property var owner: null
            property var calls: []
            function addDrawingLine(stroke) {
                calls = calls.concat([{token: String(stroke.token), controller: sentinel, owner: owner}])
                if (owner && typeof owner.record === "function") owner.record("controller")
            }
        }
    }

    // Decoys in the caller's context must never receive a handler's callback.
    property QtObject controller: QtObject { property var calls: [] }
    property QtObject documentViewTools: QtObject {
        property QtObject activePen: QtObject { property string tool: "caller-decoy" }
    }

    Component {
        id: documentFactory
        Item {
            id: documentOwner
            property string ownerId: ""
            property alias tools: documentViewTools
            readonly property var scene: sceneLoader.item
            property var receipts: []
            // Also catch lookup which incorrectly skips the scene context.
            property QtObject controller: QtObject { property var calls: [] }

            QtObject {
                id: documentViewTools
                property var owner: documentOwner
                property QtObject activePen: QtObject {
                    property string tool: documentOwner.ownerId + "-pen"
                }
            }

            Component {
                id: sceneFactory
                Item {
                    id: root
                    readonly property string ownerId: documentOwner.ownerId
                    property QtObject controllerSlot: null
                    readonly property QtObject controller: controllerSlot
                    property var strokeHandler: null
                    property int nextGeneration: 0
                    property int retiredCount: 0
                    property int completedCount: 0
                    property var before: []
                    property var events: []
                    signal completedStroke()
                    signal cnProbeSubmitted(var snapshot)
                    onCompletedStroke: { completedCount++; record("completed") }
                    Component.onCompleted: {
                        controllerSlot = controllerFactory.createObject(root, {owner: root})
                    }

                    function record(label) { events = events.concat([label]) }
                    function captureBefore(snapshot) {
                        before = before.concat([snapshot])
                        record("before")
                    }
                    function createHandler(objectParent) {
                        if (strokeHandler) return null
                        strokeHandler = handlerFactory.createObject(objectParent || root,
                                                                     {generation: ++nextGeneration})
                        return strokeHandler
                    }
                    function retireHandler() {
                        if (!strokeHandler) return false
                        var old = strokeHandler
                        strokeHandler = null
                        old.destroy()
                        return true
                    }

                    Component {
                        id: handlerFactory
                        QtObject {
                            // Match the production collision: an inner id and
                            // a current-handler property on the enclosing root.
                            id: strokeHandler
                            property int generation: 0
                            readonly property var implicitController: controller
                            readonly property var explicitController: root.controller
                            readonly property var implicitTools: documentViewTools
                            readonly property string lineTool: documentViewTools.activePen.tool
                            signal strokeCompleted(var stroke)
                            // Fixture notification only, never a native or
                            // complete-QObject-destruction acknowledgement.
                            Component.onDestruction: root.retiredCount++
                            onStrokeCompleted: function(stroke) {
                                completedStroke()
                                // Copy scalars before the fake controller call;
                                // retain object identities for exact assertions.
                                var snapshot = Object.freeze({
                                    token: String(stroke.token), generation: generation,
                                    handler: strokeHandler, publishedHandler: root.strokeHandler,
                                    owner: root, controller: controller,
                                    explicitController: root.controller,
                                    tools: documentViewTools, tool: lineTool,
                                    x: Number(stroke.boundingRect.x),
                                    y: Number(stroke.boundingRect.y)
                                })
                                root.captureBefore(snapshot)
                                controller.addDrawingLine(stroke)
                                root.record("after")
                                root.cnProbeSubmitted(snapshot)
                            }
                        }
                    }
                }
            }

            Loader { id: sceneLoader; sourceComponent: sceneFactory }
            Connections {
                target: sceneLoader.item
                function onCnProbeSubmitted(snapshot) {
                    documentOwner.receipts = documentOwner.receipts.concat([
                        {document: documentOwner, scene: sceneLoader.item, snapshot: snapshot}
                    ])
                }
            }
        }
    }

    TestCase {
        id: testCase
        name: "HandlerFactoryLexicalOwnership"
        property var first: null
        property var second: null

        function init() {
            first = createTemporaryObject(documentFactory, fixture, {ownerId: "first"})
            second = createTemporaryObject(documentFactory, fixture, {ownerId: "second"})
            verify(first && second && first.scene && second.scene)
            verify(first.scene !== second.scene)
            verify(first.scene.controller && second.scene.controller)
            verify(first.scene.controller !== second.scene.controller)
            verify(first.tools !== second.tools)
            verify(first.scene.createHandler())
            verify(second.scene.createHandler())
        }

        function checkBindings(document) {
            var scene = document.scene, handler = scene.strokeHandler
            verify(handler)
            compare(handler.implicitController, scene.controller)
            compare(handler.explicitController, scene.controller)
            compare(handler.implicitTools, document.tools)
            compare(handler.lineTool, document.tools.activePen.tool)
        }

        function submit(document, token) {
            checkBindings(document)
            var scene = document.scene, handler = scene.strokeHandler
            var beforeCount = scene.before.length, receiptCount = document.receipts.length
            var calls = scene.controller.calls.length, completed = scene.completedCount
            var eventCount = scene.events.length
            var stroke = {token: token, boundingRect: {x: 12, y: 34}}
            handler.strokeCompleted(stroke)
            compare(scene.before.length, beforeCount + 1)
            compare(document.receipts.length, receiptCount + 1)
            compare(scene.controller.calls.length, calls + 1)
            compare(scene.completedCount, completed + 1)
            compare(scene.events.slice(eventCount).join(","), "completed,before,controller,after")
            var snapshot = scene.before[beforeCount]
            var receipt = document.receipts[receiptCount]
            compare(receipt.snapshot, snapshot)
            compare(receipt.document, document)
            compare(receipt.scene, scene)
            compare(snapshot.owner, scene)
            compare(snapshot.controller, scene.controller)
            compare(snapshot.explicitController, scene.controller)
            compare(snapshot.handler, handler)
            compare(snapshot.publishedHandler, handler)
            compare(snapshot.generation, handler.generation)
            compare(snapshot.tools, document.tools)
            compare(snapshot.tool, document.tools.activePen.tool)
            compare(snapshot.token, token)
            var call = scene.controller.calls[calls]
            compare(call.owner, scene)
            compare(call.controller, scene.controller)
            compare(call.token, token)
            verify(Object.isFrozen(snapshot))
            stroke.token = "changed-after-callback"
            stroke.boundingRect.x = 999
            compare(snapshot.token, token)
            compare(snapshot.x, 12)
            compare(snapshot.y, 34)
            compare(document.controller.calls.length, 0)
            compare(fixture.controller.calls.length, 0)
        }

        function test_two_instances_and_interleaved_callbacks() {
            submit(first, "first-1")
            compare(second.receipts.length, 0)
            submit(second, "second-1")
            submit(first, "first-2")
            compare(first.scene.controller.calls.length, 2)
            compare(second.scene.controller.calls.length, 1)
        }

        function test_tool_bindings_stay_in_enclosing_document_context() {
            first.tools.activePen.tool = "first-eraser"
            compare(first.scene.strokeHandler.lineTool, "first-eraser")
            compare(second.scene.strokeHandler.lineTool, "second-pen")
            second.tools.activePen.tool = "second-highlighter"
            submit(second, "second-tool")
            submit(first, "first-tool")
        }

        function test_controller_binding_tracks_only_its_scene() {
            var previous = first.scene.controller
            var other = second.scene.controller
            var replacement = createTemporaryObject(controllerFactory, first.scene, {owner: first.scene})
            verify(replacement)
            first.scene.controllerSlot = null
            compare(first.scene.strokeHandler.implicitController, null)
            compare(first.scene.strokeHandler.explicitController, null)
            first.scene.controllerSlot = replacement
            checkBindings(first)
            compare(second.scene.strokeHandler.implicitController, other)
            submit(first, "rebound-controller")
            compare(previous.calls.length, 0)
            compare(other.calls.length, 0)
        }

        function test_inner_handler_id_is_not_published_handler_property() {
            var scene = first.scene, handler = scene.strokeHandler
            scene.strokeHandler = null
            // Deliberately exercise only JS lookup with a stale publication.
            // This is not permission for a native retiring handler to write.
            handler.strokeCompleted({token: "id-scope", boundingRect: {x: 12, y: 34}})
            compare(scene.before.length, 1)
            compare(scene.before[0].handler, handler)
            compare(scene.before[0].publishedHandler, null)
            compare(scene.before[0].owner, scene)
            compare(scene.before[0].controller, scene.controller)
            compare(first.receipts.length, 1)
            compare(first.receipts[0].document, first)
            compare(second.receipts.length, 0)
            handler.destroy()
            tryCompare(scene, "retiredCount", 1, 1000)
        }

        function test_retire_and_recreate_each_instance() {
            submit(first, "first-before")
            submit(second, "second-before")
            var secondHandler = second.scene.strokeHandler
            verify(first.scene.retireHandler())
            compare(first.scene.strokeHandler, null)
            tryCompare(first.scene, "retiredCount", 1, 1000)
            compare(second.scene.strokeHandler, secondHandler)
            compare(second.scene.retiredCount, 0)
            verify(first.scene.createHandler())
            compare(first.scene.strokeHandler.generation, 2)
            submit(first, "first-after")
            submit(second, "second-still-original")
            var firstHandler = first.scene.strokeHandler
            verify(second.scene.retireHandler())
            tryCompare(second.scene, "retiredCount", 1, 1000)
            verify(second.scene.createHandler())
            compare(first.scene.strokeHandler, firstHandler)
            compare(second.scene.strokeHandler.generation, 2)
            submit(second, "second-after")
            submit(first, "first-still-recreated")
        }

        function test_object_parent_does_not_replace_creation_context() {
            verify(first.scene.retireHandler())
            tryCompare(first.scene, "retiredCount", 1, 1000)
            // Both documents are retained. Only QObject ownership changes;
            // the factory's declaration context must still be the first scene.
            verify(first.scene.createHandler(second.scene))
            submit(first, "foreign-object-parent")
            compare(second.scene.controller.calls.length, 0)
            compare(second.receipts.length, 0)
            verify(first.scene.retireHandler())
            tryCompare(first.scene, "retiredCount", 2, 1000)
        }
    }
}
