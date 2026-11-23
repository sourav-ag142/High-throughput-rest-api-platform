# High-Throughput REST API & Scalability Platform

A backend engineering project demonstrating REST API development, PostgreSQL query handling, Redis caching, and repeatable load testing using Node.js and Fastify.

## What this project demonstrates

- Building REST endpoints with Fastify.
- Using PostgreSQL connection pooling for persistent data.
- Applying Redis TTL caching to frequently requested product and category data.
- Comparing three application modes: baseline, async query execution, and optimized caching.
- Measuring endpoint performance with Autocannon and mixed traffic with k6.
- Running the application and its dependencies with Docker Compose.

## Technology stack

| Technology | Role |
|---|---|
| Node.js | Runtime |
| Fastify | HTTP API framework |
| PostgreSQL | Relational database |
| Redis | In-memory cache |
| Docker Compose | Local multi-service environment |
| Autocannon | Focused HTTP benchmarking |
| k6 | Scenario-based load testing |

## Architecture

```text
                Autocannon / k6
                       |
                       v
                 Fastify REST API
                  /           \
                 v             v
           Redis cache      PostgreSQL
           (optimized)      connection pool
                                |
                                v
                          Products / Categories
```

In optimized mode, product lookups and category lists check Redis first and use PostgreSQL on a cache miss. Cache entries use a configurable TTL. If Redis is unavailable, the API falls back to PostgreSQL so the service can still respond.

## Application modes

Set `MODE` in `.env` before starting the API.

| Mode | Behavior |
|---|---|
| `baseline` | Direct PostgreSQL reads; report queries execute sequentially |
| `async` | Direct PostgreSQL reads; independent report queries execute concurrently |
| `optimized` | Async report queries plus Redis caching for product and category reads |

These modes are intended as an educational comparison, not a claim that one setting is universally faster. Benchmark them under the same workload and environment.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Application and dependency health |
| GET | `/products/:id` | Retrieve a product |
| GET | `/categories` | List categories and product counts |
| GET | `/reports/summary` | Aggregate product and category statistics |

See [API documentation](docs/API.md).

## Project structure

```text
.
├── db/
│   └── init.sql
├── docs/
│   ├── API.md
│   └── BENCHMARKING.md
├── scripts/
│   └── init-db.js
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── bench.js
└── load.js
```

## Run with Docker Compose

Docker Compose starts PostgreSQL, Redis, and the API. The database schema and sample data are initialized on the first database volume creation.

```bash
docker compose up --build
```

API base URL: `http://localhost:5000`

Check health:

```bash
curl http://localhost:5000/health
```

To change the mode, set it when launching Compose, for example:

```bash
MODE=baseline docker compose up --build
```

To stop services:

```bash
docker compose down
```

To also remove the local database volume and its data:

```bash
docker compose down -v
```

## Run locally

Requirements: Node.js 20+, PostgreSQL, and Redis.

```bash
npm install
cp .env.example .env
```

Update `DATABASE_URL` and `REDIS_URL` in `.env`, then initialize the database:

```bash
npm run db:init
npm start
```

## Benchmarking

Autocannon benchmark command:

```bash
node bench.js <label> <product|category|report|health> [connections=100] [seconds=15]
```

Examples:

```bash
node bench.js baseline product 100 15
node bench.js optimized product 100 15
node bench.js optimized report 100 15
```

Mixed workload with k6:

```bash
k6 run load.js
```

The k6 script uses a 70% product lookup, 20% category list, and 10% report traffic mix. Configure virtual users and duration with `VUS` and `DURATION`, and the target with `BASE_URL`.

Read [the benchmarking guide](docs/BENCHMARKING.md) before comparing results. Keep hardware, data volume, concurrency, duration, and cache warm-up consistent. Report requests/second, latency percentiles, errors, and non-2xx responses. A k6 check count is not requests/second.

## Performance notes

Historical development measurements discussed during project planning included an Autocannon run around 40,295 requests/second and a k6 run with 2,174,240 successful checks. These are **historical, environment-specific observations**, not verified results from the code currently published here. Re-run the included benchmark scripts on your machine before presenting performance claims in a resume or interview.

## Security and configuration

- Never commit a real `.env` file or credentials.
- The included sample credentials are for local development only.
- Add authentication, authorization, request rate limiting, and production secrets management before exposing this sample service publicly.

## License

No license has been selected yet. Add a license file if you intend to permit reuse or distribution.
