// app/types.ts
export type PriceType = "fixed" | "decrease_amount" | "decrease_percent";

export interface Rule {
    [key: string]: unknown;
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
}

export interface ShopData {
    id: string;
    shopDomain: string;
    name: string;
    senderEmail: string;
    senderEmailEnabled: boolean;
}