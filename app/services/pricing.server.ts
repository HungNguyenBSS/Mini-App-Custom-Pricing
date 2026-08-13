import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface BackendRule {
  id: string;
  name: string;
  status: string;
  priority: number;
  applyTo: "all" | "tags";
  tags: string[];
  priceType: string;
  amount: number;
  createdAt: string;
}

export async function syncRulesToMetafield(admin: AdminApiContext, shopDomain: string) {
  const res = await fetch(
    `${process.env.BACKEND_URL}/rules?status=enable`,
    { headers: { "x-shop-domain": shopDomain } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch active rules: ${res.status}`);
  }
  const rules: BackendRule[] = await res.json();

  const payload = rules.map((r) => ({
    id: r.id,
    applyTo: r.applyTo,
    tags: r.tags,
    priceType: r.priceType,
    amount: r.amount,
    createdAt: r.createdAt,
  }));

  const shopQuery = await admin.graphql(`#graphql
    query { shop { id } }
  `);
  const shopData = await shopQuery.json();
  const shopGid = shopData.data.shop.id;

  const response = await admin.graphql(
    `#graphql
    mutation SetActiveRules($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key namespace }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            ownerId: shopGid,
            namespace: "custom_pricing",
            key: "active_rules",
            type: "json",
            value: JSON.stringify(payload),
          },
        ],
      },
    },
  );

  const result = await response.json();
  const errors = result.data?.metafieldsSet?.userErrors;
  if (errors?.length) {
    throw new Error(`Metafield sync failed: ${JSON.stringify(errors)}`);
  }
  return result.data.metafieldsSet.metafields;
}

export async function ensureActiveRulesMetafieldDefinition(admin: AdminApiContext) {
  const response = await admin.graphql(
    `#graphql
    mutation CreateDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { code message }
      }
    }`,
    {
      variables: {
        definition: {
          name: "Custom Pricing Active Rules",
          namespace: "custom_pricing",
          key: "active_rules",
          type: "json",
          ownerType: "SHOP",
          access: { storefront: "PUBLIC_READ" },
        },
      },
    },
  );
  const result = await response.json();
  const errors = result.data?.metafieldDefinitionCreate?.userErrors;
  const realErrors = errors?.filter((e: any) => e.code !== "TAKEN");
  if (realErrors?.length) {
    throw new Error(`Definition creation failed: ${JSON.stringify(realErrors)}`);
  }
}