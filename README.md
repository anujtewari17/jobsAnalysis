# jobsAnalysis

A US research-job market explorer. A dependency-free static frontend with a reproducible Python data refresh and browser-local CSV analysis.

## Run

Requires Python 3 and Node 18+ for tests. No npm install is needed.

```sh
npm run dev
# http://localhost:8000
npm test
npm run refresh
```

`dist/` is the deployable website. `scripts/refresh_context.py` fetches the public Indeed Hiring Lab dataset and calculates monthly means. Commit `dist/data/context.json` after an intentional refresh; the site never silently substitutes sample data.

## What works

- Real US national and four sector job-posting indices since February 2020.
- Sector/period comparisons, baseline comparisons, provisional latest-month insights, accessible data table, and CSV export.
- Local CSV import, schema checks, strict calendar date validation, US scope, title-based research-role classification, source/ID deduplication, quality report, annual sample counts, employer mix, role/year filters, and export.
- Imported records stay in browser memory and disappear on refresh. Maximum file size 10 MB. No server upload or persistence.

## Posting CSV contract

Required: `id,title,company,posted_date,country,source`.
Optional: `location` (retained but not yet analyzed).
Dates must be YYYY-MM-DD and not in the future. US country aliases are US, USA, United States, United States of America. Posting IDs must be stable within each source. Duplicate source/ID pairs keep the first record. Different sources can still duplicate the same job.

Title matching includes core UXR (UX/User/User Experience Research titles and UXR), Research Operations, and adjacent Design/Product Research. It is an explicit heuristic, not a validated occupation model. Review borderline and hybrid titles before making claims. Generic researcher and designer titles are excluded. Case is normalized for title matching and source IDs but posting IDs remain case sensitive.

## Data sources and interpretation

Indeed Hiring Lab: https://github.com/hiring-lab/job_postings_tracker
License: CC BY 4.0. Attribution shown on site. Our transformation is the monthly arithmetic mean of daily seasonally adjusted total-posting indices, with day counts and latest observation dates retained. February 1, 2020 = 100. Latest month may be incomplete. Historical data can be revised. These indices describe all jobs or broad sectors; **none is a UX Research time series**. They are neither employment counts nor counts of new hires. Source data availability determines end date; we do not interpolate missing values.

Potential granular sources:
- NLx Research Hub: https://nlxresearchhub.org/data-access (approved access required). Verify field history and redistribution conditions.
- Lightcast: https://lightcast.io/our-data/postings (licensed access). Confirm specific product's historical coverage and aggregate publication rights.
- BLS employment/wage data can supply occupational context, but broad categories cannot be relabeled UXR.

No NLx/Lightcast data or fabricated UXR history is included. We have not yet established a freely available, consistent, title-level US UXR historical dataset.

## Next research milestone

1. Obtain a consistent granular historical source; document access, license, years, population, and source changes.
2. Audit a manually labeled title sample and expand aliases while retaining core/adjacent distinctions.
3. Establish deduplication/repost rules and coverage by year; distinguish new postings from active inventory.
4. Produce monthly/annual UXR counts and share of all postings within the same source. Treat partial years separately.
5. Add salary, geography, seniority, skills and work arrangement only where missingness and comparability support them. Analyze associations rather than claiming causal effects.

The current annual CSV results describe the imported sample, not national demand. Missing years are not treated as zero. No year-over-year growth is asserted for imported records without validated coverage.
