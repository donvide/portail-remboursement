# Admin Refund Status API

## Endpoint
- `POST /api/update-refund-status`
- `GET /api/admin-refund?reference=RMB-YYYYMMDD-XXXXXX`
- `GET /api/admin-refunds`

## Auth
Use header:
- `x-admin-token: <REFUND_ADMIN_TOKEN>`

Set `REFUND_ADMIN_TOKEN` in Vercel environment variables.
Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel environment variables.

## Allowed statuses
- `received`
- `review`
- `scheduled`
- `paid`
- `rejected`

## Request body
```json
{
  "reference": "RMB-20260303-123456",
  "status": "scheduled"
}
```

## Example cURL
```bash
curl -X POST "https://<your-site>.vercel.app/api/update-refund-status" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <YOUR_ADMIN_TOKEN>" \
  -d '{"reference":"RMB-20260303-123456","status":"paid"}'
```
