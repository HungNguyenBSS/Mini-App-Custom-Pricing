import type { Rule } from "../types";

const API_BASE = "/api";

function ruleHeaders(shopDomain: string) {
  return { "Content-Type": "application/json", "x-shop-domain": shopDomain };
}

export const api = {
  async listRules(shopDomain: string): Promise<Rule[]> {
    const res = await fetch(`${API_BASE}/rules`, {
      headers: { "x-shop-domain": shopDomain },
    });
    return res.json();
  },
  async getRule(shopDomain: string, id: string): Promise<Rule | undefined> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      headers: { "x-shop-domain": shopDomain },
    });
    if (res.status === 404) return undefined;
    return res.json();
  },
  async createRule(shopDomain: string, data: Omit<Rule, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: "POST",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateRule(shopDomain: string, id: string, data: Partial<Rule>) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: "PUT",
      headers: ruleHeaders(shopDomain),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async duplicateRule(shopDomain: string, id: string) {
    const res = await fetch(`${API_BASE}/rules/${id}/duplicate`, {
      method: "POST",
      headers: { "x-shop-domain": shopDomain },
    });
    return res.json();
  },
  async removeRule(shopDomain: string, id: string) {
    await fetch(`${API_BASE}/rules/${id}`, {
      method: "DELETE",
      headers: { "x-shop-domain": shopDomain },
    });
  },
};