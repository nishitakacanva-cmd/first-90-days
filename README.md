# The First 90 Days · Studio Bridge Exhibit 3

```
npm install
npm run build                     # → dist/
python3 tools/build_print.py      # regenerates public/print/*.pdf from src/data/content.json
python3 tools/qa_print.py public/print
cd dist && python3 -m http.server 8767   # then: python3 qa_interaction_tests.py / qa_viewport_tests.py
```

- **Edit the content** in `src/data/content.json`. The screen and the print PDFs both read it.
- **Assets** live in `public/assets/04_The_First_90_Days/` (copied from the verified pack) and `public/assets/derived/`. Each derived file is recorded in `src/data/asset-manifest.json`.
- **Asset keys:** use `asset(key)`. It throws on an unknown key, so a guessed filename can't reach the page.
- **Keyboard:**
  - ←/→ or PgUp/PgDn turn the page;
  - Home and End jump to the cover and to Day 90;
  - I opens the index;
  - E opens the evidence drawer;
  - L cycles the light;
  - Esc closes any panel.
