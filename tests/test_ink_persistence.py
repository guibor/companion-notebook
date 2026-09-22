"""Synthetic local-file fixtures only. These bytes are never sent to a tablet."""
import json
from pathlib import Path
import runpy
import tempfile
import unittest

from rmscene import SceneLineItemBlock, write_blocks
from rmscene.crdt_sequence import CrdtSequenceItem
from rmscene.scene_items import Line, Pen, PenColor, Point
from rmscene.tagged_block_common import CrdtId

verify = runpy.run_path("ops/verify-disposable-ink.py")["verify"]
IDS = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]
PAGE = "33333333-3333-4333-8333-333333333333"


class PersistenceVerifierTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="companion-saved-fixture-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.log = self.root / "probe.log"
        self.log.write_text(
            "Companion probe: created disposable IDs " + " ".join(IDS) + "\n"
            "Companion ink: gate open; size=1620x2160; docs=" + ",".join(IDS) + "\n"
            "Companion ink: submitted pane=0; points=3; bounds=8,18,304,54\n"
            "Companion ink: submitted pane=1; points=3; bounds=8,18,304,54\n"
            "Companion probe: fixed ink submissions completed; panes=2; durable=unverified\n")
        for i, document_id in enumerate(IDS):
            directory = self.root / "documents" / document_id
            directory.mkdir(parents=True)
            directory.with_suffix(".metadata").write_text(json.dumps({"visibleName": "Companion test " + ("Reference " if i == 0 else "Notes ") + "fixture"}))
            self.write_lines(i)

    def write_lines(self, pane, count=1, bend=0, endpoints_only=False, offsets=None,
                    thickness=1.0, tool=Pen.BALLPOINT_2):
        blocks = []
        for i, offset in enumerate(offsets if offsets is not None else [0] * count):
            points = [Point(10, 20 + offset, 1, 0, 4, 100), Point(160, 45 + bend + offset, 1, 0, 4, 100), Point(310, 70 + offset, 1, 0, 4, 100)]
            if endpoints_only:
                points = [points[0], points[-1]]
            line = Line(PenColor.BLACK, tool, points, thickness, 0)
            blocks.append(SceneLineItemBlock(CrdtId(0, 1), CrdtSequenceItem(CrdtId(1, 2+i), CrdtId(0, 0), CrdtId(0, 0), 0, line)))
        with (self.root / "documents" / IDS[pane] / (PAGE + ".rm")).open("wb") as stream:
            write_blocks(stream, blocks)

    def test_roundtrip_persistence_is_not_release_or_visual_acceptance(self):
        receipt = verify(self.root)
        self.assertEqual(receipt["status"], "two-disposable-stroke-shapes-persisted")
        self.assertEqual(len(receipt["panes"]), 2)
        self.assertFalse(receipt["releaseQualified"])
        self.assertFalse(receipt["nativeReopenVerified"])

    def test_duplicate_or_missing_ink_refused(self):
        for count in [0, 2]:
            self.write_lines(1, count=count)
            with self.assertRaises(AssertionError):
                verify(self.root)

    def test_point_contamination_refused(self):
        self.write_lines(0, bend=20)
        with self.assertRaisesRegex(AssertionError, "deviates"):
            verify(self.root)

    def test_native_failure_or_wrong_point_count_refused(self):
        original = self.log.read_text()
        for data in [original + "Companion probe: FAILED mapping\n", original.replace("points=3", "points=2")]:
            self.log.write_text(data)
            with self.assertRaises(AssertionError):
                verify(self.root)

    def test_unlabelled_personal_note_refused(self):
        (self.root / "documents" / (IDS[1] + ".metadata")).write_text(json.dumps({"visibleName": "Personal notebook"}))
        with self.assertRaisesRegex(AssertionError, "labelled disposable"):
            verify(self.root)

    def test_native_log_color_and_source_location_are_not_bounds(self):
        self.log.write_text("\n".join("04:36:00.000 \x1b[02;32mqml " + line + "\x1b[0;37m (probe qrc:/test.qml:123)\x1b[0m" for line in self.log.read_text().splitlines()))
        self.assertEqual(verify(self.root)["status"], "two-disposable-stroke-shapes-persisted")

    def test_different_saved_sampling_preserves_shape_without_claiming_exact_samples(self):
        self.write_lines(1, endpoints_only=True)
        receipt = verify(self.root)
        self.assertEqual(receipt["panes"][1]["nativePoints"], 3)
        self.assertEqual(receipt["panes"][1]["savedPoints"], 2)
        self.assertFalse(receipt["exactSamplePreservationVerified"])

    def test_lost_endpoint_does_not_pass_sampling_tolerance(self):
        self.log.write_text(self.log.read_text().replace("bounds=8,18,304,54", "bounds=18,18,294,54"))
        with self.assertRaisesRegex(AssertionError, "coordinates"):
            verify(self.root)

    def retirement_fixture(self):
        data = self.log.read_text().replace("bounds=8,18,304,54", "bounds=8,18,304,54; round=1")
        data = data[:data.index("Companion probe: fixed ink submissions")]
        data += ("Companion retirement: both native handlers retired; generation=1\n"
                 "Companion retirement: live geometry moved; steps=12; elapsed-ms=200; visual=unverified\n"
                 "Companion retirement: round=2; height=1320\n"
                 "Companion ink: gate open; size=1620x2160; docs=" + ",".join(IDS) + "\n"
                 "Companion ink: submitted pane=0; points=3; bounds=8,218,304,54; round=2\n"
                 "Companion ink: submitted pane=1; points=3; bounds=8,218,304,54; round=2\n"
                 "Companion probe: retirement ink submissions completed; panes=2; strokes=4; durable=unverified\n")
        self.log.write_text(data)
        for pane in [0, 1]:
            self.write_lines(pane, offsets=[200, 0])  # Do not assume CRDT order.

    def test_retirement_matches_four_distinct_shapes_not_crdt_order(self):
        self.retirement_fixture()
        receipt = verify(self.root)
        self.assertEqual(receipt["status"], "four-disposable-stroke-shapes-persisted-after-retirement")
        self.assertEqual([s["bounds"][1] for s in receipt["panes"][0]["strokes"]], [20, 220])
        self.assertFalse(receipt["releaseQualified"])

    def test_duplicate_first_round_cannot_impersonate_post_move_ink(self):
        self.retirement_fixture()
        self.write_lines(0, count=2)
        with self.assertRaises(AssertionError):
            verify(self.root)

    def test_retirement_requires_two_rounds_same_notes_and_native_ack(self):
        self.retirement_fixture()
        original = self.log.read_text()
        for altered in [original.replace("generation=1", "generation=2"),
                        original.replace("round=2", "round=1"),
                        original.replace("height=1320", "height=1080"),
                        original.replace("bounds=8,218", "bounds=8,18")]:
            self.log.write_text(altered)
            with self.assertRaises(AssertionError):
                verify(self.root)

    def test_thickness_two_reconstructs_exact_native_padding(self):
        for pane in (0, 1):
            self.write_lines(pane, thickness=2.0)
        self.log.write_text(self.log.read_text().replace("bounds=8,18,304,54", "bounds=7,17,306,56"))
        receipt = verify(self.root)
        for pane in receipt["panes"]:
            self.assertEqual(pane["bounds"], [10, 20, 300, 50])
            self.assertEqual(pane["nativeBoundsReconstructed"], [7, 17, 306, 56])
            self.assertEqual(pane["nativeBoundsPadding"], 3)

    def test_padding_is_not_a_general_tolerance_increase(self):
        self.write_lines(0, thickness=2.0)
        self.log.write_text(self.log.read_text().replace("bounds=8,18,304,54", "bounds=13,17,306,56"))
        with self.assertRaisesRegex(AssertionError, "coordinates"):
            verify(self.root)

    def test_unqualified_tools_and_thickness_are_refused(self):
        for kwargs in ({"tool": Pen.FINELINER_2}, {"thickness": 3.0}):
            self.write_lines(0, **kwargs)
            with self.assertRaisesRegex(AssertionError, "Unqualified"):
                verify(self.root)

    def admission_fixture(self):
        gate = "Companion ink: gate open; size=1620x2160; docs=" + ",".join(IDS)
        lines = [
            "Companion admission: cold native worker roundtrip passed",
            "Companion probe: created disposable IDs " + " ".join(IDS),
            gate,
            "Companion ink: submitted pane=0; points=3; bounds=8,18,304,54; round=1",
            "Companion admission: transition requested during second stroke",
            "Companion ink: submitted pane=1; points=3; bounds=8,118,304,54; round=1",
            "Companion admission: drained during stroke; submissions=2; generation=1",
            "Companion admission: round=2; height=1440; fresh-candidates=true",
            gate,
            "Companion ink: submitted pane=0; points=3; bounds=8,218,304,54; round=2",
            "Companion ink: submitted pane=1; points=3; bounds=8,318,304,54; round=2",
            "Companion ink: gate closed",
            "Companion probe: admission ink submissions completed; panes=2; strokes=4; durable=unverified",
        ]
        self.log.write_text("\n".join(lines) + "\n")
        # Four distinct locations, with each page deliberately serialized in
        # reverse round order. Receipt order must not depend on CRDT order.
        self.write_lines(0, offsets=[200, 0])
        self.write_lines(1, offsets=[300, 100])
        return lines

    def test_admission_matches_four_distinct_shapes_without_release_claims(self):
        self.admission_fixture()
        receipt = verify(self.root)
        self.assertEqual(receipt["status"], "four-disposable-stroke-shapes-persisted-after-admission")
        self.assertEqual([pane["document"] for pane in receipt["panes"]], IDS)
        self.assertEqual([[stroke["bounds"][1] for stroke in pane["strokes"]]
                          for pane in receipt["panes"]], [[20, 220], [120, 320]])
        for flag in ("releaseQualified", "nativeReopenVerified",
                     "exactSamplePreservationVerified", "visualClippingVerified"):
            self.assertIs(receipt[flag], False)

    def test_admission_missing_or_duplicate_each_receipt_refused(self):
        lines = self.admission_fixture()
        for index, marker in enumerate(lines):
            for duplicate in (False, True):
                with self.subTest(index=index, marker=marker, duplicate=duplicate):
                    altered = lines[:index] + ([marker, marker] if duplicate else []) + lines[index + 1:]
                    self.log.write_text("\n".join(altered) + "\n")
                    with self.assertRaises(AssertionError):
                        verify(self.root)

    def test_admission_first_round_receipt_after_park_refused(self):
        lines = self.admission_fixture()
        for source in (3, 5):
            with self.subTest(pane=0 if source == 3 else 1):
                altered = lines.copy()
                late = altered.pop(source)
                parked = next(i for i, line in enumerate(altered) if "drained during stroke" in line)
                altered.insert(parked + 1, late)
                self.log.write_text("\n".join(altered) + "\n")
                with self.assertRaises(AssertionError):
                    verify(self.root)

    def test_admission_wrong_handoff_height_or_freshness_refused(self):
        self.admission_fixture()
        original = self.log.read_text()
        for old, new in (("height=1440", "height=1320"),
                         ("height=1440", "height=1080"),
                         ("fresh-candidates=true", "fresh-candidates=false"),
                         ("fresh-candidates=true", "fresh-candidates=true-stale"),
                         ("; fresh-candidates=true", ""),
                         ("submissions=2; generation=1", "submissions=1; generation=1"),
                         ("submissions=2; generation=1", "submissions=2; generation=2")):
            with self.subTest(replacement=new):
                self.log.write_text(original.replace(old, new))
                with self.assertRaises(AssertionError):
                    verify(self.root)

    def test_admission_mixed_successful_profiles_refused(self):
        self.admission_fixture()
        original = self.log.read_text()
        for success in ("Companion probe: fixed ink submissions completed; panes=2; durable=unverified",
                        "Companion probe: retirement ink submissions completed; panes=2; strokes=4; durable=unverified"):
            with self.subTest(success=success):
                self.log.write_text(original + success + "\n")
                with self.assertRaises(AssertionError):
                    verify(self.root)

    def test_admission_malformed_missing_or_extra_round_refused(self):
        lines = self.admission_fixture()
        for index in (3, 5, 9, 10):
            round_suffix = "; round=1" if index < 9 else "; round=2"
            for replacement in ("", "; round=0", "; round=3", "; round=garbage", "; round=2x"):
                with self.subTest(index=index, round=replacement):
                    altered = lines.copy()
                    altered[index] = altered[index].replace(round_suffix, replacement)
                    self.log.write_text("\n".join(altered) + "\n")
                    with self.assertRaises(AssertionError):
                        verify(self.root)
        extra = "Companion ink: submitted pane=0; points=3; bounds=8,418,304,54; round=3"
        self.log.write_text("\n".join(lines[:11] + [extra] + lines[11:]) + "\n")
        with self.assertRaises(AssertionError):
            verify(self.root)

    def test_admission_extra_or_missing_saved_ink_refused(self):
        for pane in (0, 1):
            for offsets in ([], [0], [0, 200, 400]):
                with self.subTest(pane=pane, offsets=offsets):
                    self.admission_fixture()
                    self.write_lines(pane, offsets=[offset + pane * 100 for offset in offsets])
                    with self.assertRaises(AssertionError):
                        verify(self.root)

    def test_admission_incorrect_document_identities_refused(self):
        lines = self.admission_fixture()
        original = "\n".join(lines) + "\n"
        for index in (2, 8):
            for pair in ((IDS[1], IDS[0]), (IDS[0], IDS[0]), (IDS[0], PAGE)):
                with self.subTest(gate=index, pair=pair):
                    altered = lines.copy()
                    altered[index] = altered[index].replace(",".join(IDS), ",".join(pair))
                    self.log.write_text("\n".join(altered) + "\n")
                    with self.assertRaises(AssertionError):
                        verify(self.root)
        self.log.write_text(original.replace(" ".join(IDS), " ".join(reversed(IDS))))
        with self.assertRaises(AssertionError):
            verify(self.root)
        self.log.write_text(original.replace(IDS[1], IDS[0]))
        with self.assertRaises(AssertionError):
            verify(self.root)

    def test_admission_stale_first_round_shapes_cannot_impersonate_new_ink(self):
        for pane in (0, 1):
            with self.subTest(pane=pane):
                self.admission_fixture()
                self.write_lines(pane, offsets=[pane * 100, pane * 100])
                with self.assertRaises(AssertionError):
                    verify(self.root)


if __name__ == "__main__":
    unittest.main()
