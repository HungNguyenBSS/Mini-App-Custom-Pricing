// app/mock/api.ts
import type { Rule, Product, ShopData } from "../types";

const API_BASE = "/api";

export const api = {
  async listRules(): Promise<Rule[]> {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  },
  async getRule(id: string): Promise<Rule | undefined> {
    const res = await fetch(`${API_BASE}/rules/${id}`);
    if (res.status === 404) return undefined;
    return res.json();
  },
  async createRule(data: Omit<Rule, "id" | "createdAt" | "updatedAt">) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateRule(id: string, data: Partial<Rule>) {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async duplicateRule(id: string) {
    const res = await fetch(`${API_BASE}/rules/${id}/duplicate`, {
      method: "POST",
    });
    return res.json();
  },
  async removeRule(id: string) {
    await fetch(`${API_BASE}/rules/${id}`, {
      method: "DELETE",
    });
  },
  async getShop(): Promise<ShopData> {
    const res = await fetch(`${API_BASE}/shop`);
    if (res.status === 404) {
      // Mock default shop if not created
      return {
        id: "1",
        shopDomain: "h-ng-nt1.myshopify.com",
        name: "Hung NT1",
        senderEmail: "luanhv@bsscommerce.com",
        senderEmailEnabled: true,
      };
    }
    return res.json();
  },
  async updateSenderEmail(senderEmail: string, enabled: boolean) {
    const res = await fetch(`${API_BASE}/shop`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderEmail, senderEmailEnabled: enabled }),
    });
    if (res.status === 404) {
       return fetch(`${API_BASE}/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain: "h-ng-nt1.myshopify.com", senderEmail, senderEmailEnabled: enabled }),
      }).then(r => r.json());
    }
    return res.json();
  },
};
