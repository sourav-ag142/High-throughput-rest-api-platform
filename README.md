# High-Throughput REST API & Scalability Platform

A backend engineering project focused on building and benchmarking a REST API with Node.js, Fastify, PostgreSQL, and Redis. The project explores how database access patterns, asynchronous request handling, and caching affect API throughput and latency.

## Overview

The platform was developed to study performance bottlenecks in a backend service and compare progressively optimized request-handling approaches.

The benchmark server supports three modes:

- **Baseline** — direct database-backed request handling.
- **Async** — asynchronous request-handling improvements.
- **Optimized** — Redis caching alongside PostgreSQL to reduce repeated database reads.

> The exact behavior of each mode should be verified against the implementation in `server.js` before extending this description.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Fastify | HTTP server and REST API framework |
| PostgreSQL | Persistent relational database |
| Redis | In-memory caching |
| Docker | Containerization / local infrastructure |
| Autocannon | HTTP benchmarking |
| k6 | Scenario-based load testing |

## Architecture

```text
                 Clients / Load Generators
                    (Autocannon, k6)
                            |
                            v
                    Fastify REST API
                            |
                 +----------+----------+
                 |                     |
                 v                     v
             Redis Cache          PostgreSQL
          (optimized mode)       (persistent data)
```

In the optimized path, Redis can serve frequently requested data and reduce repeated database reads. PostgreSQL remains the persistent data store.

## Benchmarking

The project uses two tools for performance evaluation:

- **Autocannon** for focused endpoint benchmarks with configurable connection counts and test duration.
- **k6** for mixed-traffic load tests that simulate a more realistic request distribution.

The mixed k6 workload used these traffic proportions:

| Request category | Traffic share |
|---|---:|
| Item lookups | 70% |
| Category lists | 20% |
| CPU-heavy reports | 10% |

### Recorded test observations

The following figures are historical results from development runs, not guaranteed performance targets. Results depend on hardware, database state, cache warm-up, concurrency, and test duration.

| Measurement | Recorded result |
|---|---:|
| One Autocannon run | ~40,295 requests/second |
| Total requests in that run | 604,409 |
| Errors in that run | 0 |
| One k6 run | 2,174,240 successful checks |
| Check success rate in that run | 100% |
| Average HTTP request duration in that run | ~671.36 µs |

**Important:** k6 checks are assertions executed by the test script; they are not the same as HTTP requests per second. The k6 check count should not be described as throughput.

To reproduce and compare results, use the benchmark scripts and record the mode, endpoint, connection/VU count, duration, machine specifications, and whether Redis was warm or cold.

## Project Structure

The repository is expected to contain the application and benchmark scripts, for example:

```text
.
├── server.js       # Fastify API and database/cache integration
├── bench.js        # Autocannon endpoint benchmark
├── load.js         # k6 mixed-traffic load test
├── package.json
├── .env.example
├── docker-compose.yml
└── README.md
```

Adjust this tree to match the actual files committed to the repository.

## Getting Started

The application source and its dependency scripts need to be present in this repository before these steps can be run.

1. Install Node.js (LTS), PostgreSQL, and Redis, or start the infrastructure with the project's Docker Compose configuration.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file using the variables documented in `.env.example`.
4. Create and initialize the PostgreSQL database using the schema or setup scripts included with the project.
5. Start the API using the start script defined in `package.json`.

Do not commit real credentials, API keys, or production connection strings. Keep `.env` out of version control.

## Running Benchmarks

Use the scripts and arguments defined in the checked-in implementation. The previously used Autocannon command format was:

```bash
node bench.js <label> <product|category|report> [connections=100] [seconds=15]
```

The k6 script was used for a mixed workload with a default of 100 virtual users and a two-minute duration. Confirm the current script defaults before running:

```bash
k6 run load.js
```

## Engineering Focus

- Measuring throughput and latency under concurrent load.
- Identifying database and CPU-related bottlenecks.
- Understanding connection-pool pressure and repeated database reads.
- Evaluating Redis caching for read-heavy workloads.
- Comparing baseline and optimized request paths with repeatable load tests.

## Future Improvements

- Add endpoint-level benchmark tables with environment details.
- Add automated tests and CI checks.
- Add cache invalidation and TTL behavior documentation.
- Add request validation, structured logging, and health checks.
- Add Docker Compose instructions and reproducible database initialization.
- Track p50, p95, and p99 latency alongside throughput and error rate.

## License

Choose and add a license before distributing or reusing this project.
