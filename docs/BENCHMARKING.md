# Benchmarking Guide

Run the same workload against each mode and keep the environment constant.

## Start infrastructure

With Docker Compose:

```bash
docker compose up --build
```

For local development, start PostgreSQL and Redis separately, copy `.env.example` to `.env`, initialize the schema with `npm run db:init`, and start the API with `npm start`.

## Compare modes

Set `MODE=baseline`, `MODE=async`, or `MODE=optimized` and restart the API between runs. With Docker Compose, set the variable when starting the stack, for example:

```bash
MODE=baseline docker compose up --build
```

Then run focused endpoint tests:

```bash
node bench.js baseline product 100 15
node bench.js baseline category 100 15
node bench.js baseline report 100 15
```

Repeat for the other modes. Allow warm-up runs and repeat each measurement.

## Mixed workload with k6

```bash
k6 run load.js
```

Optional environment overrides:

```bash
VUS=100 DURATION=2m BASE_URL=http://localhost:5000 k6 run load.js
```

## Record results

For every run, record:
- mode and endpoint/workload
- CPU, RAM, OS, Node.js, PostgreSQL, and Redis versions
- connection count or virtual users and duration
- requests per second, p50/p95/p99 latency, errors, and non-2xx responses
- cache warm-up state

Autocannon requests/sec and k6 check counts are different metrics. A k6 check is an assertion, not an HTTP request. Do not compare them as if they were the same measurement.

These scripts are a reproducible starting point; measured results must be collected on the machine and environment where the tests are run.
