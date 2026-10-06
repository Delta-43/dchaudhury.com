---
label: Data
order: 2
title: Data engineer and analyst
description: CV of Debadeep Chaudhury, data engineer and analyst in Warsaw. Pipelines and databases for multi-terabyte sequencing data, and data APIs for city data.
summary: I build pipelines and databases for messy, real data, and I say where each number comes from. 5 years of research programming on multi-terabyte sequencing data, then data APIs and ETL for city data in 2026.
pdf: DChaudhury_CV_Data.pdf
---

## Experience

### Independent Software Developer

Warsaw · Jan 2026 – present

- **GdzieZamieszkać** (HackYeah 2026, top 10 in the Artificial Intelligence track): compares Kraków's 18 districts on 51 measures from public data, with the source, date and caveat on every number. I coordinated the team of 3 and built the data layer: PostgreSQL with PostGIS (22 migrations, 47 of 51 metrics populated) and a FastAPI data API (16 operations, 161 offline tests). Language-model reports go through a guard that drops any text with a number not in the source facts.
- **Warsaw in Numbers** (in progress): compares city districts for renting or buying. Python ETL, Supabase PostgreSQL migrations, FastAPI. I coordinate a team of 3 with a locked `main` branch, pull request review and validation gates.
- **ft_WarsawStories** (42 Warsaw Hacks 2026, 3rd place): a cache-first FastAPI and SQLite backend with scheduled sync jobs against the 42 Intra API and a stale-cache fallback. React 19 and Recharts frontend.
- **Arbor** (Codaro Coding Challenge II, 1st in Track B, 2nd overall): a config-driven booking engine on Supabase PostgreSQL with row-level security. I managed the team of 5 and co-developed the backend with Alban Billiette.
- **Homelab:** PostgreSQL 18, MinIO object storage and n8n automation on an Ubuntu server with 25 Docker containers.

### Bioinformatician, Doctoral Researcher, Nencki Institute of Experimental Biology

Warsaw · Sept 2021 – Dec 2025

- Built pipelines (Python, R, Bash) and in-house databases to catalogue, process and analyse multi-terabyte next-generation sequencing data from human, chimpanzee and rhesus macaque cells.
- Built a pipeline to separate sequencing data from several species grown together in one culture.
- Developed metrics to compare developmental stages of stem-cell-derived astrocytes, and predictive algorithms for patterns of gene expression over time.
- Co-author of 3 peer-reviewed papers. Supervised 4 interns.

### Doctoral Intern, Max Planck Institute for Molecular Genetics

Berlin · Oct – Nov 2024

- Processed and analysed single-cell RNA-seq data with Cell Ranger and R. Integrated data from several experiments for a cross-species comparison.

### Junior Research Fellow (Bioinformatician), JNCASR

Bengaluru · Aug 2020 – Jul 2021

- Analysed yeast genomics data (ChIP-seq, RNA-seq, MNase-seq) with Python, R and Bash.

## Education

- **Software engineering, Core Curriculum,** 42 Warsaw · June 2026 – present
- **Piscine** (4-week selection bootcamp in C and Shell), 42 Warsaw · Feb 2026
- **M.Sc. Bioinformatics and Biotechnology,** IBAB, Bengaluru · 2020
- **B.Tech. Biotechnology,** Neotia Institute of Technology, Management and Science, Kolkata · 2018

## Skills

- **Programming languages:** Python, SQL, TypeScript, JavaScript, R, C, Bash; C++ and Java (training)
- **Data:** PostgreSQL, PostGIS, Supabase, SQLite, MongoDB, ETL pipelines, scheduled sync jobs, caching
- **Analysis:** Python (pandas), R, Bioconductor, statistical modelling, clustering
- **Pipelines:** Snakemake, Bash, Docker, GitHub Actions
- **APIs:** FastAPI, REST, OpenAPI

## Languages

English (C2), Bengali and Hindi (native), Polish (B1), French and German (elementary).
