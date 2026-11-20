import { getStore } from "@netlify/blobs";

// Code d'accès admin (modifiable via la variable d'environnement CODE_ACCES sur Netlify)
const CODE = (process.env.CODE_ACCES || "lapatate").trim().toLowerCase();

export default async (req) => {
  const store = getStore("chambre128");
  const admin = (req.headers.get("x-code") || "").trim().toLowerCase() === CODE;
  const headers = { "Cache-Control": "no-store" };

  if (req.method === "GET") {
    const state = await store.get("state", { type: "json" });
    if (!state) return Response.json({ state: null, admin }, { headers });
    // Les rappels et comptes rendus ne sont visibles que par l'admin
    const out = admin ? state : { ...state, rappels: [], reports: [] };
    return Response.json({ state: out, admin }, { headers });
  }

  if (req.method === "POST") {
    if (!admin) return new Response("Code incorrect", { status: 401 });
    let body;
    try { body = await req.json(); } catch { return new Response("JSON invalide", { status: 400 }); }
    if (!body || !Array.isArray(body.members) || !Array.isArray(body.plan)) {
      return new Response("Données invalides", { status: 400 });
    }
    body.updatedAt = new Date().toISOString();
    await store.setJSON("state", body);
    return Response.json({ ok: true, updatedAt: body.updatedAt }, { headers });
  }

  return new Response("Méthode non autorisée", { status: 405 });
};

export const config = { path: "/api/data" };
