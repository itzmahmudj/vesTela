import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("weight");
  const data = (await store.get("history", { type: "json" })) || [];
  return new Response(JSON.stringify(data.slice(-90)), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const config = { path: "/api/weight" };
