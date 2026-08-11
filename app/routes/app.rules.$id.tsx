// app/routes/app.rules.$id.tsx
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { Banner, EmptyState, Page, Spinner } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { api } from "../mock/api";
import type { Rule } from "../types";
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

export default function EditRule() {
   const { products } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getRule(id)
      .then(setRule)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner accessibilityLabel="Loading rule" />;

  if (!rule) {
    return (
       <Page title="Rule not found" backAction={{ url: "/app/rules" }}>
        <EmptyState
          heading="Rule not found"
          action={{ content: "Back to rules", onAction: () => navigate("/app/rules") }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>This rule may have been removed or is no longer available.</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page
      title={`Edit custom pricing rule "${rule.name}"`}
      backAction={{ url: "/app/rules" }}
    >
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}
      <RuleForm
        initial={rule}
        products={products}
        submitLabel="Save changes"
        onSubmit={async (data) => {
          try {
            await api.updateRule(rule.id, data);
            navigate("/app/rules");
          } catch {
            setError("Could not update rule. Please try again.");
          }
        }}
      />
    </Page>
  );
}
