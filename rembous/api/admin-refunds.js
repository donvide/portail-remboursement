import { assertStorageConfigured, listRefunds } from "./_lib/store.js";
import { json, methodNotAllowed } from "./_lib/http.js";

function isAuthorized(req) {
  const expected = process.env.REFUND_ADMIN_TOKEN;
  if (!expected) return false;
  const provided = req.headers["x-admin-token"];
  return String(provided || "") === expected;
}

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, "GET")) return;

  if (!isAuthorized(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    assertStorageConfigured();
    const records = await listRefunds();
    records.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return json(res, 200, { records });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      error: error.message || "Internal server error",
    });
  }
}

