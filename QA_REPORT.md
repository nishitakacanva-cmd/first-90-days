# Exhibit 3: The First 90 Days. QA report

**Version:** 1.0 · Studio Bridge · Exhibit 3 of 5
**Build:** React 19 + TypeScript + Vite 8. `npm install && npm run build`, then serve `dist/` from any static server (it works from a subfolder because the base is `./`).
**Content source:** `src/data/content.json` holds all copy, the 12 days, the threads, the badge text, sources and disclaimers. The app reads it through `content.ts`, and the print builder (`tools/build_print.py`) reads the same file, so the screen and the PDFs can't drift apart.

## What it is
A ring-bound desk calendar on the overhead oak desk from the asset pack.
- **Pages:** a cover plus twelve day pages (00, 01, 03, 07, 14, 21, 30, 45, 60, 75, 85 and 90). Each page is typeset live in HTML/CSS with its own paper mechanism. Every day has a "New designer / The team" perspective toggle.
- **Desk props:** every prop does something:
  - mug: move it to reveal the day's question;
  - access badge: 3D flip, and its wording changes by day;
  - pencil: circles the day;
  - binder clips: bookmark the page;
  - sticky notes: write on the page;
  - sketchbook: opens your notes to self;
  - loose sheets: open the evidence drawer;
  - torn-off pages: open the day index;
  - envelope: goes to the Day 00 letter;
  - transparent ruler: goes to Day 21 and lays the revised brief over the original.
- **Lighting:** four overlays (morning, afternoon, evening, desk lamp). Prop shadows follow the light, and under the lamp they point away from it.
- **Finding:** "THE OFFER WAS DAY ZERO. THE UNDERSTANDING CAME LATER." It shows three threads (the role, the team, your preferences), filled only from the pages you opened plus your own marks, together with a compact map of all 91 days. You can copy it, save it as .txt or print it.
- **Print:** real print-ready A3 and A2 PDFs.

## Day mechanisms
| Day | Mechanism |
|---|---|
| 00 | A tri-fold offer letter unfolds; three pencil questions appear in the margin |
| 01 | The formal org chart is on a flap; lift it to reveal the unwritten chart (6 notes) |
| 03 | Pull six task slips from the job-description pocket and sort each one as Listed, Implied or Not mentioned. There is no answer key. |
| 07 | Three conflicting stickies; tap them in the order you'd reply. Each then shows what that reviewer is looking after, plus one suggested question. |
| 14 | An unsent draft: Send, Rewrite (the apology is struck out) or Keep it in drafts |
| 21 | An acetate ruler slider wipes the revised brief over the original and reveals the ripple |
| 30 | Turn six cards: Learned something, Just did it, or Not sure |
| 45 | The agenda unfolds in two folds; item 4 is filled from your Day 30 cards |
| 60 | File six slips into two trays: Portfolio or The team remembers |
| 75 | Three acetate tabs: the idea of it, the work as it is, and what I'd keep |
| 85 | Two sheets slide together; the overlap is revealed |
| 90 | The completed experience map: 91 squares, 12 turning points with thread dots, and your marks and clips. Each square links back to its day. |

## Tested (automated, headless Chrome)
- **Interactions: 104/104.** Run with `qa_interaction_tests.py`. Covered:
  - The cover copy is verbatim, including the research note.
  - The 18 SVG rings centre on the 18 punched holes, within 1px.
  - Page turns:
    - forward and back by tab, arrow keys, PgUp/PgDn, Home/End, and pointer swipe;
    - a second key press during a turn is ignored;
    - you can't turn past Day 90 or before the cover.
  - All 12 headlines, themes and texts match `content.json` exactly.
  - Every day mechanism listed above, including keyboard use of the slider, cards and tabs.
  - Every desk prop.
  - The index shows its marks, and the evidence drawer shows the current day's basis and sources.
  - The sketchbook works.
  - The lighting overlays are exclusive; lamp shadows point away from the lamp; the L key cycles the light.
  - The three PDFs are served and the A3 downloads.
  - The print stylesheet prints only the calendar page, or only the summary when the finding is open.
  - The finding:
    - the headline is exact;
    - the threads come from visited pages;
    - Day 30 and Day 75 choices carry through;
    - there are no scores or percentages;
    - Copy, Save .txt and Print all work;
    - Back keeps your state, and Reset clears everything.
  - No localStorage or sessionStorage is used, and there are no console errors or failed requests.
  - Reduced motion: the page crossfades in about 200 ms instead of the 3D flip.
  - Missing images get labelled fallbacks, and the calendar and mug still work without their images.
- **Viewports: 6/6.** Run with `qa_viewport_tests.py`. Sizes tested: 1920×1080, 1440×900, 1366×768 (desk stage), 1024×768 and 768×1024 tablets (touch), and 390×844 phone (touch). These two layouts get the stacked view. Each run goes cover → letter → Day 21 brief → mug and badge → Day 90 → finding.
  - No horizontal overflow and no errors at any size.
  - All touch targets on tablet and phone are at least 30 px; the main controls are 38–40 px.
- **Print PDFs: 12/12.** Run with `tools/qa_print.py`. Checked for both A3 and A2:
  - 14 pages;
  - trim 297×420 / 420×594 mm;
  - 3 mm bleed with crop marks;
  - all fonts embedded as subsets;
  - no raster images, so the text and shapes are fully vector;
  - the top binding zone (15 mm on A3, 21 mm on A2) carries only background on every page.

  I also rendered every page and checked it by eye.

## Not tested
- A real screen reader. ARIA labels, live announcements and focus are wired, but the only checks were automated.
- Real touch hardware. Touch was emulated; swipe was tested with pointer events.
- Real print output and colour. The PDFs are CMYK without an ICC output intent, so get a hard proof before production.
- Inside the claude.ai artifact viewer, Save .txt, Print and PDF downloads may be blocked. Copy works there, and every button says what happened.

## Defects found and fixed in this pass
1. The lighting overlays washed out the page text in patches. They now reach the calendar page at about 35% strength through a plate-unit mask, while the desk and props keep the full overlay.
2. The Day 21 ruler was a stretched, blurry photo of the ruler. It's now a crisp SVG acetate scale; the ruler photo is still the desk prop.
3. The formal org-chart connectors didn't meet the boxes. They are redrawn in grid units.
4. The attribution strip was illegible under the evening and lamp light. It now sits on a paper label.
5. The finding now includes the compact 91-day map of your own path.
6. Tablet controls were 24–29 px tall; they are now 38–40 px in the stacked layout.
7. The Bauer citation said culture was on pp. 4–5; it is actually p. 6. Now "pp. 4–6". It also now states the p. 13 point as the guide words it.

## Assets: used vs skipped
**Used** (all from `04_The_First_90_Days`):
- `FD_ENV_01_OverheadDesk`
- `FD_LIGHT_01`–`04`
- `FD_PAGE_01_CalendarPageTemplate` (the index pile)
- `FD_PROP_01`–`12`

**Derived copies** (the originals are untouched, and every derivation is recorded in `asset-manifest.json`):
- `FD_PROP_02`–`10` `__clean`: the leftover light background fringe is removed so that only the live, light-matched shadows show.
- `FD_PROP_01` `__board`: cropped to the board. The rings cut out above it were broken, so the rings are redrawn in SVG and aligned to the photographed holes.

**Skipped:** `FD_SHEET_01`–`05`. The rules forbid showing whole Gemini sheets as live UI.

**Missing from the pack:** nothing this exhibit needed. The calendar pages themselves are typeset, not images, because the brief requires vector type.

## Sources and disclaimers
- **Studio Bridge primary research, thematic synthesis.** The twelve day themes come from it. Paraphrased; no participant is quoted.
- **Bauer, T. N. (2010).** *Onboarding New Employees: Maximizing Success.* SHRM Foundation. Points used:
  - the Four C's (p. 2);
  - about 90 days to prove yourself (p. 1);
  - self-efficacy (p. 4), role clarity and social integration (p. 5), culture (p. 6);
  - information- and feedback-seeking, and reluctance to ask questions that may reveal weaknesses (p. 13).

  Each page reference was checked against the PDF.
- **Deloitte (2025).** *Gen Z and Millennial Survey.* Learning and development is among the top three reasons for choosing an employer.

**On screen and in print:**
- "An illustrated synthesis of interview themes, not a day-by-day diary of a real participant."
- The days are narrative turning points, not longitudinal data.
- All names, letters, briefs, comments, drafts and replies are invented.
- Nothing is scored.
- Nothing is stored. State lives in the tab and clears on reset or close.
