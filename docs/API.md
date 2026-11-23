# API Reference

Base URL: `http://localhost:5000`

## Health

`GET /health`

Returns application, PostgreSQL, and (when enabled) Redis connectivity status.

## Get a product

`GET /products/:id`

Example: `GET /products/1`

Returns product details and a cache indicator (`HIT`, `MISS`, or `BYPASS`). Invalid IDs return 400; unknown products return 404.

## List categories

`GET /categories`

Returns categories with product counts.

## Summary report

`GET /reports/summary`

Returns aggregate product statistics and product counts by category.

## Error responses

- `400`: invalid request parameter
- `404`: resource not found
- `500`: unexpected server error
- `503`: health check cannot reach PostgreSQL
