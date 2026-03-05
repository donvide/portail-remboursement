import { kv } from "@vercel/kv";

const STORE_PREFIX = "refund-requests";

function key(reference) {
  return `${STORE_PREFIX}:${reference}`;
}

export function assertStorageConfigured() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    const error = new Error("Storage not configured");
    error.statusCode = 500;
    throw error;
  }
}

export async function getRefund(reference) {
  return kv.get(key(reference));
}

export async function setRefund(reference, record) {
  await kv.set(key(reference), record);
}

export async function deleteRefund(reference) {
  await kv.del(key(reference));
}

export async function listRefunds() {
  const pattern = `${STORE_PREFIX}:*`;
  const keys = [];
  let cursor = "0";

  do {
    const [nextCursor, batch] = await kv.scan(cursor, {
      match: pattern,
      count: 100,
    });
    cursor = String(nextCursor || "0");
    for (const item of batch || []) {
      keys.push(item);
    }
  } while (cursor !== "0");

  if (!keys.length) {
    return [];
  }

  const values = await kv.mget(...keys);
  return (values || []).filter(Boolean);
}
