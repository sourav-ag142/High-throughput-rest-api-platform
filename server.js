require('dotenv').config();

const Fastify = require('fastify');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = Fastify({ logger: true });
const MODE = (process.env.MODE || 'optimized').toLowerCase();
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 60);

if (!['baseline', 'async', 'optimized'].includes(MODE)) {
  throw new Error('MODE must be baseline, async, or optimized');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

let redisClient;
let redisReady = false;

async function connectRedis() {
  if (MODE !== 'optimized') return;
  redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  redisClient.on('error', (error) => {
    redisReady = false;
    app.log.warn({ err: error }, 'Redis client error; requests will use PostgreSQL');
  });
  try {
    await redisClient.connect();
    redisReady = true;
    app.log.info('Redis connected');
  } catch (error) {
    app.log.warn({ err: error }, 'Redis unavailable; continuing without cache');
  }
}

async function getCached(key) {
  if (!redisReady || !redisClient?.isOpen) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    app.log.warn({ err: error }, 'Cache read failed');
    return null;
  }
}

async function setCached(key, value) {
  if (!redisReady || !redisClient?.isOpen) return;
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: CACHE_TTL_SECONDS });
  } catch (error) {
    app.log.warn({ err: error }, 'Cache write failed');
  }
}

async function queryProduct(id) {
  const result = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.category_id,
            c.name AS category, p.created_at
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

app.get('/health', async (_request, reply) => {
  try {
    await pool.query('SELECT 1');
    return {
      status: 'ok',
      mode: MODE,
      database: 'connected',
      cache: MODE === 'optimized' ? (redisReady ? 'connected' : 'unavailable') : 'disabled'
    };
  } catch (error) {
    reply.code(503);
    return { status: 'error', database: 'unavailable' };
  }
});

app.get('/products/:id', async (request, reply) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return reply.code(400).send({ error: 'Product id must be a positive integer' });
  }

  const key = `product:${id}`;
  if (MODE === 'optimized') {
    const cached = await getCached(key);
    if (cached) return { ...cached, cache: 'HIT' };
  }

  const product = await queryProduct(id);
  if (!product) return reply.code(404).send({ error: 'Product not found' });

  if (MODE === 'optimized') await setCached(key, product);
  return { ...product, cache: MODE === 'optimized' && redisReady ? 'MISS' : 'BYPASS' };
});

app.get('/categories', async () => {
  const key = 'categories:all';
  if (MODE === 'optimized') {
    const cached = await getCached(key);
    if (cached) return { data: cached, cache: 'HIT' };
  }

  const result = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id, c.name
     ORDER BY c.name`
  );

  if (MODE === 'optimized') await setCached(key, result.rows);
  return { data: result.rows, cache: MODE === 'optimized' && redisReady ? 'MISS' : 'BYPASS' };
});

app.get('/reports/summary', async () => {
  const fetchTotals = () => pool.query(
    `SELECT COUNT(*)::int AS total_products,
            COALESCE(AVG(price), 0)::numeric(12,2) AS average_price,
            COALESCE(SUM(price), 0)::numeric(14,2) AS inventory_value
     FROM products`
  );
  const fetchCategories = () => pool.query(
    `SELECT c.name, COUNT(p.id)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id, c.name
     ORDER BY product_count DESC, c.name`
  );

  let totals;
  let categories;
  if (MODE === 'baseline') {
    totals = await fetchTotals();
    categories = await fetchCategories();
  } else {
    [totals, categories] = await Promise.all([fetchTotals(), fetchCategories()]);
  }

  return {
    generated_at: new Date().toISOString(),
    totals: totals.rows[0],
    categories: categories.rows
  };
});

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Request failed');
  reply.code(500).send({ error: 'Internal server error' });
});

async function shutdown(signal) {
  app.log.info({ signal }, 'Shutting down');
  try {
    await app.close();
    if (redisClient?.isOpen) await redisClient.quit();
    await pool.end();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'Shutdown error');
    process.exit(1);
  }
}

async function start() {
  await connectRedis();
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch(async (error) => {
  app.log.error({ err: error }, 'Unable to start server');
  await pool.end().catch(() => {});
  process.exit(1);
});
