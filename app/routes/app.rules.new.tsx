// app/routes/app.rules.new.tsx
import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Banner, Page } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { api } from "../mock/api";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query getProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
            tags
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);
  
  const json = await response.json();
  const products = json.data.products.edges.map((e: any) => ({
    id: e.node.id,
    title: e.node.title,
    tags: e.node.tags,
    originalPrice: Number(e.node.variants.edges[0]?.node?.price || 0),
  }));
  return { products };
};
export default function NewRule() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
     <Page title="Create custom pricing rule" backAction={{ url: "/app/rules" }}>
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}
      <RuleForm
       products={products}
        submitLabel="Create rule"
        onSubmit={async (data) => {
          try {
            await api.createRule(data);
            navigate("/app/rules");
          } catch {
            setError("Could not create rule. Please try again.");
          }
        }}
      />
    </Page>
  );
}
