import type { PriceType } from "../../types";

export function computeModifiedPrice(
  original: number,
  priceType: PriceType,
  amount: number,
) {
  if (priceType === "fixed") return amount;
  if (priceType === "decrease_amount") return Math.max(0, original - amount);
  if (priceType === "decrease_percent")
    return Math.max(0, original - (original * amount) / 100);
  return original;
}

export function shortenGid(gid: string) {
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}
