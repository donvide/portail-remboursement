import { assertStorageConfigured, deleteRefund, getRefund } from "./_lib/store.js";
import { json, methodNotAllowed, parseBody } from "./_lib/http.js";

function isAuthorized(req) {
  const expected = process.env.REFUND_ADMIN_TOKEN;
  if (!expected) return false;
  const provided = req.headers["x-admin-token"];
  return String(provided || "") === expected;
}

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, "POST")) return;

  if (!isAuthorized(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  let payload;
  try {
    payload = parseBody(req);
  } catch {
    payload = null;
  }

  if (!payload) {
    return json(res, 400, { error: "Invalid JSON body" });
  }

  const reference = String(payload.reference || "").trim().toUpperCase();
  if (!reference) {
    return json(res, 400, { error: "Missing field: reference" });
  }

  try {
    assertStorageConfigured();
    const record = await getRefund(reference);
    if (!record) {
      return json(res, 404, { error: "Reference not found" });
    }

    await deleteRefund(reference);
    return json(res, 200, { reference, deleted: true });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      error: error.message || "Internal server error",
    });
  }
}
