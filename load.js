import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  scenarios: {
    mixed_traffic: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 100),
      duration: __ENV.DURATION || '2m'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99']
  }
};

export default function () {
  const choice = Math.random();

  if (choice < 0.70) {
    const response = http.get(`${BASE_URL}/products/1`);
    check(response, {
      'product lookup returns 200': (r) => r.status === 200
    });
  } else if (choice < 0.90) {
    const response = http.get(`${BASE_URL}/categories`);
    check(response, {
      'category list returns 200': (r) => r.status === 200
    });
  } else {
    const response = http.get(`${BASE_URL}/reports/summary`);
    check(response, {
      'report endpoint returns 200': (r) => r.status === 200
    });
  }

  sleep(0.1);
}
