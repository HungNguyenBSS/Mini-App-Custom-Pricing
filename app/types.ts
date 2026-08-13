// app/types.ts
export type PriceType = "fixed" | "decrease_amount" | "decrease_percent";

export interface Rule {
  id: string;
  name: string;
  status: "enable" | "disable";
  priority: number;
  applyTo: "all" | "tags";
  tags: string[];
  priceType: PriceType;
  amount: number;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  image?: string;
  originalPrice: number;
  tags: string[];
}

export interface ShopData {
  id: string;
  shopDomain: string;
  name: string;
}
