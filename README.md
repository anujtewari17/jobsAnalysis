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

No NLx/Lightcast data or fabricated UXR history is included. The bundled Kaggle LinkedIn subset now supplies title-level snapshot data; continuous national historical coverage is still unavailable.

## Next research milestone

1. Obtain a consistent granular historical source; document access, license, years, population, and source changes.
2. Audit a manually labeled title sample and expand aliases while retaining core/adjacent distinctions.
3. Establish deduplication/repost rules and coverage by year; distinguish new postings from active inventory.
4. Produce monthly/annual UXR counts and share of all postings within the same source. Treat partial years separately.
5. Add salary, geography, seniority, skills and work arrangement only where missingness and comparability support them. Analyze associations rather than claiming causal effects.

The current annual results describe the bundled or imported sample, not national demand. Missing years are not treated as zero. No year-over-year growth is asserted for imported records without validated coverage.

## Quantitative text lab (v0.2)

Add `description` to the CSV for text analysis. Optional salary fields are `salary_min,salary_max,currency,salary_period`; salary summaries require both positive numeric range endpoints, `USD`, and `annual`. No currency or hourly conversions are inferred.

`dist/text-analysis.js` contains the auditable dictionary and pure analysis functions; `dist/quant-ui.js` renders the lab. No LLM service or credentials are required. Features:

- 17 dictionary themes across methods, tools, topics and responsibilities, counted once per description.
- Year cohort comparisons of document prevalence, explicit match counts/denominators and percentage-point differences. Missing descriptions are excluded from theme denominators and reported separately.
- Annual sample coverage, number of sources, explicit experience lower-bound medians, salary range-midpoint medians and overall salary interquartile range.
- Document-frequency rankings of unigrams/adjacent bigrams after a fixed stopword list and minimum document threshold.
- Theme-specific annual trajectories, searchable source excerpts, full cleaned descriptions, and extraction evidence.
- Exported theme comparisons include cohort years, role filter, corpus type, raw counts, denominators, shares and differences.
- Opt-in synthetic demonstration (48 entirely fictional postings). Synthetic output is labeled on screen and in exports. It is not historical UXR data and is never loaded automatically.

Dictionary matches are **mentions**, not confirmed qualifications: negations, preferred/required distinctions and employer boilerplate are not resolved. Lone `R` is not matched; explicit R programming phrases are. Experience extraction supports numeric ranges and plus forms linked to experience, excludes conflicting lower bounds, and does not interpret degree substitutions or written-out numbers. These limitations require a manually audited labeled sample before using the extracts for substantive research.

Year comparisons are descriptive. No p-values or population confidence intervals are reported for a convenience sample with unknown coverage and dependence. Source/ID deduplication does not resolve cross-source reposts. Stable sourcing, complete periods, employer mix and missing-text patterns must be assessed before interpreting changing theme shares. No sentiment, AI displacement, or causal conclusions are manufactured from text mentions.

## Bundled real corpus (v0.3)

The lab now loads 43 real descriptions automatically: 9 from 2023 and 34 from 2024. These come from two separately downloaded versions of Arsh Koneru's [LinkedIn Job Postings](https://www.kaggle.com/datasets/arshkon/linkedin-job-postings), v9 and v13 (157,095 raw records combined). Kaggle metadata declares **CC BY-SA 4.0**. The source credits @zoeyyuzou for additional scraping. The adapted corpus and its data-derived outputs are offered under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); no endorsement is implied.

Reproduce without API credentials:

```sh
mkdir -p work
curl -fL 'https://www.kaggle.com/api/v1/datasets/download/arshkon/linkedin-job-postings?datasetVersionNumber=9' -o work/linkedin-v9.zip
curl -fL 'https://www.kaggle.com/api/v1/datasets/download/arshkon/linkedin-job-postings?datasetVersionNumber=13' -o work/linkedin-v13.zip
python3 scripts/prepare_linkedin.py
node scripts/analyze_corpus.mjs
npm test
```

Archive SHA-256 hashes, raw month distributions, explicit-US counts, processing rules and an inclusion/exclusion audit are embedded in `dist/data/research-corpus.json`. `dist/data/research-analysis.json` contains computed results from the same functions used by the frontend. Raw archives are ignored and never deployed. Prepared descriptions and computed data are the share-alike adaptations; attribution, license and change notes appear in the frontend.

The pipeline screens explicit-US posting locations, uses original posting time (fallback listed time), reviews ambiguous title candidates using checked-in exclusions, then collapses LinkedIn IDs and exact cleaned descriptions (which can merge location variants). It excludes 9 non-UX candidates and 3 exact-description duplicates. Title recall is unvalidated: synonyms and non-explicit US locations may be missed. Near duplicates, recruiter reposts and employer boilerplate remain possible.

**These snapshots cannot establish annual hiring growth.** V9 is concentrated in August/November 2023; v13 is overwhelmingly April 2024. The 9-description 2023 UX cohort is too small for robust historical conclusions. Use the comparison as exploratory corpus analysis and obtain broader, consistent historical coverage before making market claims.

## Recent source: Jobicy (v0.4)

The app now opens on the **Jobicy (remote)** source. The pinned archive through November 12, 2026 contains 11,708 records / 8,593 distinct Jobicy IDs, but only **two distinct explicitly US UX Research roles** after title screening, description review, and repost deduplication. The LinkedIn sample remains a separate source option. Source filters apply to summary metrics, annual counts, terms, evidence, and exported comparisons. The simpler employer/annual panel has its own source selector.

The research jobs' earliest archive publication dates are September 3 and September 15, 2026; repeated appearances occur October 4 and October 16. There are no later matching US research roles in this download. `pubDate` can reset on repost and is not verified employer-original posting time. We retain the earliest publication per ID within the downloaded archive. This small, remote-only source cannot establish national demand or historical growth. An all-source selection shows an explicit coverage warning.

```sh
python3 scripts/fetch_jobicy.py
node scripts/analyze_jobicy.mjs
npm test
```

The fetch script pins the repository revision returned at fetch time, records SHA-256 hashes of the selected daily files, and limits publication files to the November 12, 2026 cutoff. Raw data and dataset terms remain in ignored `work/jobicy/`. JSONL is split on ASCII newlines (Unicode paragraph separators can occur inside valid description strings). The preparation script records exclusions and repeated appearances. Change the cutoff intentionally when refreshing; this deployment does not run a background schedule.

Jobicy's custom dataset terms permit analysis and use of the compilation but do not relicense employers' full descriptions. We analyze full descriptions locally and deploy **prepared dictionary features, document-term sets, experience/salary extracts, and canonical Jobicy links**, rather than full descriptions. The app uses these prepared features only for trusted bundled data, not arbitrary CSV content. Data-derived metrics and terms use the same analysis functions as personal uploads and the older source. The prepared outputs are `dist/data/jobicy-corpus.json` and `dist/data/jobicy-analysis.json` and retain Jobicy attribution; they are not labeled as LinkedIn's CC BY-SA data.

Source: https://huggingface.co/datasets/jobicy/remote-jobs
Terms: https://huggingface.co/datasets/jobicy/remote-jobs/blob/main/LICENSE
Canonical listings link back to https://jobicy.com. No endorsement or current-open status is implied.
