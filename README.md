# Capacity Checker

A small React app to help you decide whether you have the capacity to take on a new task, by comparing:

- **Your current capacity** — a self-assessed score from a four-option check-in (Energised, Stable, Delicate, Underwater), fine-tuned with a slider.
- **A task's importance** — scored from six weighted criteria (deadline, consequences, dependents, etc.), then adjusted down based on three yes/no questions about whether the task can be minimised, delegated, or whether others would still insist on it.

The two scores are compared to produce one of three verdicts: **Take it on**, **Manageable, but be mindful**, or **Defer or seek support**.

Your in-progress answers are saved to your browser's local storage so a refresh won't lose your place — no account or server needed.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

To enable it:

1. Push this repo to GitHub.
2. In your repo, go to **Settings → Pages**, and under "Build and deployment", set **Source** to "GitHub Actions".
3. Push to `main` (or re-run the workflow from the **Actions** tab).
4. Your site will be live at `https://<your-username>.github.io/capacity-checker/`.

If you rename the repo, update the `base` path in `vite.config.js` to match (`/your-repo-name/`).

## Scoring logic

- **Capacity score**: 0–10, picked from your selected band.
- **Raw importance score**: sum of six criteria (each 0–3, max 18), scaled to 0–10.
- **Adjustment**: −1 if the task can be minimised/rearranged, −1 if it can be delegated without much effort, −1 if others would *not* still want you to do it knowing the difficulty.
- **Adjusted importance** = raw importance + adjustment (floored at 0).
- **Verdict**: based on the difference between capacity and adjusted importance.
  - ≥ +2 → Take it on
  - between −2 and +2 → Manageable, but be mindful
  - ≤ −2 → Defer or seek support

Tweak the numbers in `src/App.jsx` (`IMPORTANCE_CRITERIA`, `CAPACITY_BANDS`, `calculate()`) any time you want to adjust the model.
