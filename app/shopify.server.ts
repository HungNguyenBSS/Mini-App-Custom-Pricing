import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { MySQLSessionStorage } from "@shopify/shopify-app-session-storage-mysql";

const mysqlSessionStorage = new MySQLSessionStorage(
  `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`
);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.July26,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: mysqlSessionStorage,
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  hooks: {
    afterAuth: async ({ session }) => {
      await shopify.registerWebhooks({ session });
      const { admin } = await shopify.unauthenticated.admin(session.shop);
      const { ensureActiveRulesMetafieldDefinition } = await import("./services/pricing.server");
      await ensureActiveRulesMetafieldDefinition(admin);
      const response = await admin.graphql(`#graphql
      query { shop { name } }
    `);
      const data = await response.json();
      const shopName = data.data?.shop?.name ?? session.shop;

      try {
        const res = await fetch(`${process.env.BACKEND_URL}/shop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopDomain: session.shop,
            accessToken: session.accessToken,
            name: shopName,
            status: "active",
          }),
        });
      } catch (err) {
        console.error("[afterAuth] Failed to sync shop to backend:", err);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;