require('dotenv').config();
const autocannon = require('autocannon');

const [label = 'local', endpoint = 'product', connectionsArg = '100', secondsArg = '15'] =
  process.argv.slice(2);

const endpoints = {
  product: '/products/1',
  category: '/categories',
  report: '/reports/summary',
  health: '/health'
};

if (!endpoints[endpoint]) {
  console.error(`Unknown endpoint "${endpoint}". Choose: ${Object.keys(endpoints).join(', ')}`);
  process.exit(1);
}

const connections = Number(connectionsArg);
const duration = Number(secondsArg);
if (!Number.isInteger(connections) || connections < 1 || !Number.isInteger(duration) || duration < 1) {
  console.error('Connections and duration must be positive integers.');
  process.exit(1);
}

const url = process.env.BENCH_URL || `http://localhost:${process.env.PORT || 5000}`;

console.log(`Running "${label}" against ${url}${endpoints[endpoint]}`);
console.log(`Endpoint: ${endpoint} | Connections: ${connections} | Duration: ${duration}s`);

autocannon({
  url: `${url}${endpoints[endpoint]}`,
  connections,
  duration,
  pipelining: 1
}, (error, result) => {
  if (error) {
    console.error('Benchmark failed:', error);
    process.exitCode = 1;
    return;
  }

  console.log('\nBenchmark summary');
  console.log('-----------------');
  console.log(`Requests/sec (average): ${result.requests.average}`);
  console.log(`Latency (average): ${result.latency.average} ms`);
  console.log(`Latency (p99): ${result.latency.p99} ms`);
  console.log(`Total requests: ${result.requests.total}`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Non-2xx responses: ${result.non2xx}`);
});
