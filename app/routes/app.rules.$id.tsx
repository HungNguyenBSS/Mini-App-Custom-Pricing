// app/routes/app.rules.$id.tsx
import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { Banner, EmptyState, Page, Spinner } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { authenticate } from "../shopify.server";
import { syncRulesToMetafield } from "../services/pricing.server";
import type { Rule } from "../types";

type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };
type UpdateRuleInput = Omit<Rule, "id" | "createdAt" | "updatedAt">;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const id = params.id as string;

  const productsResponse = await admin.graphql(`
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
  const productsJson = await productsResponse.json();
  const products = productsJson.data.products.edges.map((e: any) => ({
    id: e.node.id,
    title: e.node.title,
    tags: e.node.tags,
    image: e.node.featuredImage?.url ?? undefined,
    originalPrice: Number(e.node.variants.edges[0]?.node?.price || 0),
  }));

  const ruleRes = await backendFetch(`/rules/${id}`, {}, session.shop);
  const data = ruleRes.ok ? await ruleRes.json() : null;
  const rule: Rule | null = data ? data.data : null;

  return { products, rule };
};

import { backendFetch } from "../lib/backend.server";

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const id = params.id as string;
  const data = (await request.json()) as UpdateRuleInput;

  try {
    const res = await backendFetch(`/rules/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }, session.shop);

    if (!res.ok) {
      return { ok: false, error: "Could not update rule. Please try again." };
    }

    try {
      await syncRulesToMetafield(admin, session.shop);
    } catch (syncErr) {
      console.error("[app.rules.$id sync] failed:", syncErr);
      return { ok: true, warning: "Rule saved, but syncing to Shopify failed." };
    }

    return { ok: true };
  } catch (err) {
    console.error("[app.rules.$id action] failed:", err);
    return { ok: false, error: "Could not update rule. Please try again." };
  }
};

export default function EditRule() {
  const { products, rule } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.ok) {
      if (fetcher.data.warning) {
        shopify.toast.show(fetcher.data.warning, { isError: true });
      } else {
        shopify.toast.show("Rule updated");
      }
      navigate("/app/rules");
    }
  }, [fetcher.data, navigate]);

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
      {fetcher.data && !fetcher.data.ok && (
        <Banner tone="critical">
          <p>{fetcher.data.error}</p>
        </Banner>
      )}
      <RuleForm
        initial={rule}
        products={products}
        submitLabel="Save changes"
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