import type { Rule, ShopData } from "../types";

const API_BASE = "/api";

function ruleHeaders(shopDomain: string) {
  return { "Content-Type": "application/json", "x-shop-domain": shopDomain };
}

export const api = {
  async listRules(shopDomain: string): Promise<Rule[]> {
    const res = await fetch(`${API_BASE}/rules`, {
      headers: { "x-shop-domain": shopDomain },
    });
    const json = await res.json();
    return json.data || [];
  },
  async getRule(shopDomain: string, id: string): Promise<Rule | undefined> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      headers: { "x-shop-domain": shopDomain },
    });
    if (res.status === 404) return undefined;
    const json = await res.json();
    return json.data;
  },
  async createRule(shopDomain: string, data: Omit<Rule, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: "POST",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },
  async updateRule(shopDomain: string, id: string, data: Partial<Rule>) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: "PUT",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },
  async duplicateRule(shopDomain: string, id: string) {
    const res = await fetch(`${API_BASE}/rules/${id}/duplicate`, {
      method: "POST",
      headers: { "x-shop-domain": shopDomain },
    });
    const json = await res.json();
    return json.data;
  },
  async removeRule(shopDomain: string, id: string) {
    await fetch(`${API_BASE}/rules/${id}`, {
      method: "DELETE",
      headers: { "x-shop-domain": shopDomain },
    });
  },
  async getShop(shopDomain: string): Promise<ShopData> {
    const res = await fetch(`${API_BASE}/shop?shopDomain=${encodeURIComponent(shopDomain)}`);
    if (res.status === 404) {
      return { id: "", shopDomain, name: shopDomain };
    }
    const json = await res.json();
    return json.data;
  },
};