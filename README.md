# Dannys Pearson Calculator

A small, accessible calculator for estimating an unreleased Pearson test score from an updated overall grade, with Danny’s requested unserious copy. Static HTML, CSS, and JavaScript; no dependencies, accounts, analytics, or server-side processing.

**Site:** https://Danielw412.github.io/Pearson-grade-calculator/

## Use it

1. Open **Student Gradebook** and copy the **Overall Score** percentage.
2. Click **Calculation** below Overall Score. In the expanded table, find **Homework → Points Earned** and copy the weighted contribution out of 30, not the raw homework score.
3. Add every already-graded test using its **Correct/Total** point values.
4. Enter the latest test’s maximum points. For a split test, add the sections’ possible points together.

The site includes the supplied screenshots with SVG circles and numbered annotations. Each field opens focused screenshot help. “Try Danny’s numbers” reproduces **64.764 / 71 ≈ 91.22%**. The screenshots are example data; visitors’ inputs remain in memory in their own browser and are never transmitted or stored.

## Calculation and assumptions

Homework contributes 30 weighted points; tests contribute 50; the overall grade is out of 80. Tests are pooled by total points, and the latest test must already be reflected in the overall grade. Exactly one test (possibly with multiple sections) is unknown. Additional weighted categories and extra-credit setups are outside this calculator’s scope.

```text
testAverage = (overallPercent / 100 × 80 − homeworkPoints) / 50
latestEarned = testAverage × (pastPossible + latestPossible) − pastEarned
latestPercent = latestEarned / latestPossible × 100
```

Displayed percentages and points are rounded to two decimal places. The calculation uses full precision; a rounded input grade makes the output an estimate. Invalid and impossible inputs display an explanation instead of a misleading score.

## Local development

Requires Node.js 18+ for tests and Python 3 for the static server.

```sh
npm test
npm start
```

Open http://localhost:5173. No install or build step is needed.

## GitHub Pages

The public site is served from **main → /docs**, using GitHub Pages’ branch deployment. Changes pushed to `main` publish automatically. Only `docs/` is published; tests and design files remain outside the site.

To configure from the repository settings, select **Settings → Pages → Deploy from a branch → main → /docs → Save**.

## Design

The [design reference](design/concept.png) was generated with the built-in image generation tool. [Design notes](design/README.md) record its brief, tokens, and intentional implementation refinements. The actual supplied gradebook screenshots are used in the site; generated screenshot content is never presented as source data.
