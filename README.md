# Marrow — staged bone-marrow reasoning

An interactive teaching tool for hematopathology trainees. You feed it a
**de-identified** bone marrow workup and it walks you through the case the way a
diagnosis actually forms — one layer at a time — instead of showing you the
answer up front.

The bet behind the design: the value isn't a prettier path report, it's the
**sequence**. Fellows rarely lack facts; they lack reps at *how each layer
should update the differential*. So the whole app is built around progressive
disclosure and logging what changed your mind.

> ⚠️ Educational use only. Not a clinical decision tool. All input is assumed to
> have PHI removed before it reaches the app. Always verify against the current
> WHO, ICC, ELN, and IPSS source documents.

## What it does

**Staged reasoning (the spine).** A case is revealed in six stages —
presentation + CBC + blast% → morphology → flow → cytogenetics → molecular →
integrated diagnosis. After each reveal you commit a differential (ranked, with
a leading pick and a confidence). The app logs the trajectory and, at the end,
reconstructs the *what-changed-your-mind* story: what entered the differential,
what left, when the leading diagnosis flipped, and how confidence moved.

**ISCN karyotype parser + ideogram.** Paste `46,XY,t(9;22)(q34;q11.2)[18]/46,XY[2]`
and it parses the clones, translates every abnormality into plain English,
computes clone size, flags complex/monosomal karyotypes, and **draws the
chromosomes** — real Giemsa-banded ideograms with the breakpoints marked and,
for translocations, both derivative chromosomes rendered with origin-tinted
segments. Recurrent abnormalities are linked to their fusion gene, entity, and
WHO5/ICC/ELN significance.

**Flow as a lineage grid.** Markers are a clickable matrix organized by lineage
(blast/stem, myeloid, monocytic, erythroid, megakaryocytic, B, T, NK, plasma).
Each cell shows the case's expression; click any marker for what it is and where
it is normally expressed. The classic teaching aberrancies auto-flag — CD7 on
myeloblasts, CD56 aberrancy, CD19 on t(8;21), HLA-DR-negative APL, the
dim-CD45 blast gate, and more.

**Classification engine that shows its work.** WHO 5th edition and ICC 2022 side
by side, each with its numbered decision path, and their disagreements pulled
out explicitly — the blast threshold for genetically-defined AML, the 10–19%
gray zone (MDS-IB2 vs MDS/AML), and the TP53 ladder. ELN 2022 risk and IPSS-R
are computed with every step exposed; IPSS-M is shown as the honest direction of
effect for each mutation (the exact weighted score belongs to the official
calculator).

**Every finding tagged by role.** Diagnostic / prognostic / predictive /
MRD-trackable — the layer that connects pathology to management. FLT3-ITD →
targetable; NPM1 → MRD marker; TP53 multi-hit → changes the transplant
conversation; DNMT3A → a DTA gene you should *not* use for MRD.

**Deep-links to your primers.** Entities and genes link out to your existing
primer library instead of re-teaching content here. Set the base URL in the
Primers settings (persisted locally); leaving it blank renders plain labels.

## Running it

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm test           # run the parser + classifier test suites
```

Node 18+ is required. The build is a fully static SPA (relative asset paths), so
`dist/` can be served from any static host, including a GitHub Pages project
subpath, with no configuration.

### Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. To turn it on once: **Settings → Pages → Build and deployment →
Source: "GitHub Actions"**. The site then serves at
`https://<owner>.github.io/<repo>/`. `.github/workflows/ci.yml` type-checks,
tests, and builds every pull request so `main` stays green.

## How it's organized

```
src/
  types/           domain models (case, cytogenetics, findings, knowledge)
  lib/
    iscn/          ISCN parser, recurrent-abnormality KB (+ tests)
    ideogram/      cytoband data + SVG ideogram / translocation renderer
    flow/          marker KB, aberrancy rules, population inference
    genes/         gene/variant knowledge base with role tags
    classify/      WHO5 vs ICC engine, ELN 2022, IPSS-R, IPSS-M (+ tests)
    findings/      per-finding role aggregation
    staging/       stage sequence + commit-trajectory logic
    report/        best-effort free-text report parser
    primers/       deep-link registry
  data/cases/      curated, de-identified teaching cases
  components/      React UI (workspace, stages, panels, commit, trajectory)
  styles/          theme-aware design system
```

The medically load-bearing logic — the ISCN parser and the classification /
risk engines — is covered by unit tests (`npm test`).

## Data attribution

The chromosome ideogram coordinates in `src/lib/ideogram/cytobands.ts` are an
ISCN 850-band table derived from the [eweitz/ideogram](https://github.com/eweitz/ideogram)
dataset (Apache-2.0), which itself derives from the NCBI/UCSC cytoband data.
Regenerate with `node scripts/gen-cytobands.mjs` (requires `npm i -D ideogram`);
the `ideogram` package is a regeneration-only dependency, not a runtime one.

## Extending it

- **Add a case:** drop a `HemeCase` in `src/data/cases/` and register it in
  `index.ts`. The engines pick it up automatically.
- **Add a gene or marker:** append to `src/lib/genes/genes.ts` or
  `src/lib/flow/markers.ts` following the existing shape.
- **Add a recurrent abnormality:** add an entry with a signature matcher to
  `src/lib/iscn/recurrent.ts`.
