import jwt from "jsonwebtoken";

export async function backendFetch(path: string, options: RequestInit = {}, shopDomain: string) {
  const secret = process.env.SHOPIFY_API_SECRET || process.env.JWT_SECRET || "fallback-secret";
  const token = jwt.sign({ shopDomain }, secret);

  const headers = {
    ...options.headers,
    "x-shop-domain": shopDomain,
    "Authorization": `Bearer ${token}`
  };

  return fetch(`${process.env.BACKEND_URL}${path}`, {
    ...options,
    headers
  });
}
