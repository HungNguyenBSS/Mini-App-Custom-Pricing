import type { Rule, ShopData } from "../types";

const API_BASE = "/api";

function ruleHeaders(shopDomain: string) {
  return { "Content-Type": "application/json", "x-shop-domain": shopDomain };
}

export const api = {
  async listRules(shopDomain: string, page: number = 1, limit: number = 10): Promise<{ data: Rule[], pagination: { total: number, page: number, limit: number, totalPages: number } }> {
    const res = await fetch(`${API_BASE}/rules?page=${page}&limit=${limit}`, {
      headers: { "x-shop-domain": shopDomain },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  },
  async getRule(shopDomain: string, id: string): Promise<Rule | undefined> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      headers: { "x-shop-domain": shopDomain },
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
  async createRule(shopDomain: string, data: Omit<Rule, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: "POST",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
  async updateRule(shopDomain: string, id: string, data: Partial<Rule>) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: "PUT",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
  async duplicateRule(shopDomain: string, id: string) {
    const res = await fetch(`${API_BASE}/rules/${id}/duplicate`, {
      method: "POST",
      headers: { "x-shop-domain": shopDomain },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
  async removeRule(shopDomain: string, id: string) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: "DELETE",
      headers: { "x-shop-domain": shopDomain },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
  },
  async getShop(shopDomain: string): Promise<ShopData> {
    const res = await fetch(`${API_BASE}/shop?shopDomain=${encodeURIComponent(shopDomain)}`);
    if (res.status === 404) {
      return { id: "", shopDomain, name: shopDomain };
    }
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    return json.data;
  },
};