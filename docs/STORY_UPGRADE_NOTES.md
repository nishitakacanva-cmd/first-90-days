# First 90 Days — illustrated story upgrade

## Artwork

The supplied `First_90_Days_StudioBridge_Assets_17_PNGs.zip` is preserved as 17 original PNGs in `public/assets/story/` and copied to the published `dist/assets/story/` by Vite. All files were inspected together on a dark contact sheet. All are 32-bit RGBA, 1800px on the longest edge, with real transparent pixels; the links and open frame are transparent inside as well as around the edges. Text and controls remain HTML.

The five-space org artwork is used for five roles. The sixth existing role, Producer, remains an interactive margin note rather than being deleted to fit the picture. Day 00 reuses the existing envelope; no additional illustration was needed.

## Behaviour

- Day 01 overlays informal help routes without a translucent flap obscuring the formal map. Roles and two speech bubbles reveal examples.
- Day 03 progressively reveals the task fan. Each slip can be classified and revisited. The synthesis counts the visitor's own classifications, with no claim that it is a research statistic. The full original job description is available alongside its short front-of-pocket summary.
- Day 07 uses one shared proof and three individually illustrated notes. Pointer movement, focus and dragging highlight the relevant proof region. Reply order can be changed with keyboard-accessible controls before confirmation.
- Day 14 swaps aligned draft/clarified artwork while preserving Send, Rewrite and Keep choices. The response is explicitly an authored example.
- Day 21 retains the ruler comparison and pairs it with the same project's format proofs, ripple arrows and affected-artifact labels.
- Day 45 carries the visitor's Day 30 learning choices into a two-way check-in. Phone copy flows below the illustrated agenda for legibility.
- Day 60 retains six sortable contributions and shows how the team can use less visible work. Filed items can move between sides.
- Day 90 and the ending assemble only artifacts whose interactions were used. Each opens “What changed / What remains unclear”. The 90-day map is retained behind an explicit disclosure on the calendar page.
- Helpers remain opt-in and dismissed object hints remain dismissed. No interaction introduces a new automatic mascot popup.

## Layout fixes

The ending and research drawer use native modal dialogs, opaque warm paper, keyboard focus containment, Escape dismissal and independent scrolling. Day 75 inactive sheet content is hidden behind opaque paper. Page-turn copies hide their footers until the transition finishes. The desk background covers the viewport; actual header height is measured. Critical desk/cover artwork is preloaded and an initial warm-paper loading surface replaces the dark blank state. Day headings use Archivo to make the capital I unambiguous.

## Verification

- `pnpm run build` passes TypeScript and Vite production compilation.
- Browser checks covered 1440×900 and 1280×800 desktop layouts and the 390×800 phone layout.
- Exercised six task classifications and revisiting a previous task; three-comment ordering and confirmation; org-map hotspots; draft rewrite/send; revised brief; Day 30 → Day 45 learning carryover; six contributions; accumulated collage and a reflection; Day 75 opaque sheets; research modal; and Day 90 → ending.
- The ending was measured at y=12 with its full bounds inside the viewport and scrollable content. Research drawer paper was measured as opaque rgb(247,242,232).
- Checked the Evening and Desk lamp lighting states, loaded artwork, visible ending CTA, and absence of horizontal overflow.
- Existing print PDFs, audio controls, lighting choices, identity badge, perspective toggle and desk props are retained. The print-only text summary remains available.
