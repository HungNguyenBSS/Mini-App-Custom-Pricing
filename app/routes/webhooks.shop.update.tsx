import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const email = (payload as any)?.email;

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/shop`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-shop-domain": shop,
      },
      body: JSON.stringify({ senderEmail: email }),
    });
    console.log("[webhook shop/update] backend status:", res.status);
  } catch (err) {
    console.error("[webhook shop/update] Failed to sync:", err);
  }

  return new Response();
};