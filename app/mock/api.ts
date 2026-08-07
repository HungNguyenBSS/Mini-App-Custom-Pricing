// app/mocks/api.ts
import type { Rule, Product, ShopData } from "../types";

let mockRules: Rule[] = [
  {
    id: "1",
    name: "100",
    status: "enable",
    priority: 0,
    applyTo: "tags",
    tags: ["b2b", "wholesale"],
    priceType: "decrease_percent",
    amount: 20,
    productIds: ["1", "2", "3"],
    createdAt: "2025-09-04",
    updatedAt: "-",
  },
];

const mockProducts: Product[] = [
  { id: "1", title: "B2Bridge B2B Wholesale Pricing", originalPrice: 99 },
  { id: "2", title: "SBC B2B Quotes & Quick Order", originalPrice: 50 },
  { id: "3", title: "test", originalPrice: 10 },
];

let mockShop: ShopData = {
  id: "1",
  shopDomain: "h-ng-nt1.myshopify.com",
  name: "Hung NT1",
  senderEmail: "luanhv@bsscommerce.com",
  senderEmailEnabled: true,
};

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async listRules(): Promise<Rule[]> {
    await delay();
    return mockRules;
  },
  async getRule(id: string): Promise<Rule | undefined> {
    await delay();
    return mockRules.find((r) => r.id === id);
  },
  async createRule(data: Omit<Rule, "id" | "createdAt" | "updatedAt">) {
    await delay();
    const newRule: Rule = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: "-",
        name: "",
        status: "enable",
        priority: 0,
        applyTo: "all",
        tags: [],
        priceType: "fixed",
        amount: 0,
        productIds: []
    };
    mockRules = [...mockRules, newRule];
    return newRule;
  },
  async updateRule(id: string, data: Partial<Rule>) {
    await delay();
    mockRules = mockRules.map((r) =>
      r.id === id
        ? { ...r, ...data, updatedAt: new Date().toISOString().slice(0, 10) }
        : r
    );
    return mockRules.find((r) => r.id === id)!;
  },
  async duplicateRule(id: string) {
    await delay();
    const source = mockRules.find((r) => r.id === id);
    if (!source) throw new Error("Rule not found");
    const copy: Rule = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: "-",
    };
    mockRules = [...mockRules, copy];
    return copy;
  },
  async removeRule(id: string) {
    await delay();
    mockRules = mockRules.filter((r) => r.id !== id);
  },
  async listProducts(): Promise<Product[]> {
    await delay();
    return mockProducts;
  },
  async getShop(): Promise<ShopData> {
    await delay();
    return mockShop;
  },
  async updateSenderEmail(senderEmail: string, enabled: boolean) {
    await delay();
    mockShop = { ...mockShop, senderEmail, senderEmailEnabled: enabled };
    return mockShop;
  },
};