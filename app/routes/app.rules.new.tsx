// app/routes/app.rules.new.tsx
import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { Banner, Page } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { authenticate } from "../shopify.server";
import { syncRulesToMetafield } from "../services/pricing.server";
import type { Rule } from "../types";

type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };
type CreateRuleInput = Omit<Rule, "id" | "createdAt" | "updatedAt">;

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
            featuredImage {
              url
            }
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
    image: e.node.featuredImage?.url ?? undefined,
    originalPrice: Number(e.node.variants.edges[0]?.node?.price || 0),
  }));
  return { products };
};

import { backendFetch } from "../lib/backend.server";

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const data = (await request.json()) as CreateRuleInput;

  try {
    const res = await backendFetch(`/rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }, session.shop);

    if (!res.ok) {
      return { ok: false, error: "Could not create rule. Please try again." };
    }

    try {
      await syncRulesToMetafield(admin, session.shop);
    } catch (syncErr) {
      console.error("[app.rules.new sync] failed:", syncErr);
      return { ok: true, warning: "Rule saved, but syncing to Shopify failed." };
    }

    return { ok: true };
  } catch (err) {
    console.error("[app.rules.new action] failed:", err);
    return { ok: false, error: "Could not create rule. Please try again." };
  }
};

export default function NewRule() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.ok) {
      if (fetcher.data.warning) {
        shopify.toast.show(fetcher.data.warning, { isError: true });
      } else {
        shopify.toast.show("Rule created");
      }
      navigate("/app/rules");
    }
  }, [fetcher.data, navigate]);

  return (
    <Page title="Create custom pricing rule" backAction={{ url: "/app/rules" }}>
      {fetcher.data && !fetcher.data.ok && (
        <Banner tone="critical">
          <p>{fetcher.data.error}</p>
        </Banner>
      )}
      <RuleForm
        products={products}
        submitLabel="Create rule"
        submitting={isSubmitting}
        onSubmit={async (data) => {
          fetcher.submit(data, {
            method: "post",
            encType: "application/json",
          });
        }}
      />
    </Page>
  );
}