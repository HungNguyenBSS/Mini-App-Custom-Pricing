import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  if (session) {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      await sessionStorage.deleteSessions(sessionIds);
    }
  }

  try {
    await fetch(`${process.env.BACKEND_URL}/shop/uninstall`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-shop-domain": shop,
      },
    });
  } catch (err) {
    console.error("[webhook app/uninstalled] Failed to update shop status:", err);
  }

  return new Response();
};