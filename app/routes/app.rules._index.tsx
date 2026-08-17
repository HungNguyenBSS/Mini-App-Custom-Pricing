import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { Card, EmptyState, Page, useIndexResourceState } from "@shopify/polaris";
import { DeleteRuleModal } from "../components/rules/DeleteRuleModal";
import { RulesTable } from "../components/rules/RulesTable";
import { useRuleFilters } from "../hooks/useRuleFilters";
import { useRules } from "../hooks/useRules";
import { authenticate } from "../shopify.server";
import { syncRulesToMetafield } from "../services/pricing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shopDomain: session.shop };
};

type ActionResult = { ok: true } | { ok: false; error: string };

import { backendFetch } from "../lib/backend.server";

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ids = formData.getAll("id") as string[];

  try {
    if (intent === "duplicate") {
      const res = await backendFetch(`/rules/${ids[0]}/duplicate`, { method: "POST" }, session.shop);
      if (!res.ok) return { ok: false, error: "Could not duplicate rule." };
    } else if (intent === "remove") {
      for (const id of ids) {
        const res = await backendFetch(`/rules/${id}`, { method: "DELETE" }, session.shop);
        if (!res.ok) return { ok: false, error: "Could not delete rule." };
      }
    } else if (intent === "enable" || intent === "disable") {
      const status = intent === "enable" ? "enable" : "disable";
      for (const id of ids) {
        const res = await backendFetch(`/rules/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }, session.shop);
        if (!res.ok) return { ok: false, error: `Could not ${status} rule(s).` };
      }
    } else return { ok: false, error: "Unknown action." };

    await syncRulesToMetafield(admin, session.shop);
    return { ok: true };
  } catch (err) {
    console.error("[app.rules._index action] failed:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
};

export default function RulesIndex() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const { rules, loading, reload } = useRules(shopDomain);
  const filters = useRuleFilters(rules);
  const navigate = useNavigate();
  const actionFetcher = useFetcher<typeof action>();
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const ruleResources = filters.sortedRules.map((rule) => ({ id: rule.id }));
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } = useIndexResourceState(ruleResources);

  useEffect(() => {
    if (actionFetcher.data?.ok) { reload(); clearSelection(); }
  }, [actionFetcher.data, reload, clearSelection]);

  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data && isDeleting) {
      setIsDeleting(false);
      if (actionFetcher.data.ok) setRuleToDelete(null);
    }
  }, [actionFetcher.state, actionFetcher.data, isDeleting]);

  const submitAction = (intent: "duplicate" | "enable" | "disable" | "remove", ids: string[]) => {
    const formData = new FormData();
    formData.set("intent", intent);
    ids.forEach((id) => formData.append("id", id));
    actionFetcher.submit(formData, { method: "post" });
  };

  return (
    <Page title="Configuration" primaryAction={{ content: "Add rule", onAction: () => navigate("/app/rules/new") }}>
      <Card padding="0">
        {rules.length === 0 && !loading ? <EmptyState heading="Chưa có rule nào" action={{ content: "Add rule", onAction: () => navigate("/app/rules/new") }} image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"><p>Tạo rule giảm giá đầu tiên cho tệp khách hàng cụ thể.</p></EmptyState> : (
          <RulesTable rules={filters.sortedRules} loading={loading} selectedResources={selectedResources} allResourcesSelected={allResourcesSelected} onSelectionChange={handleSelectionChange} mode={filters.mode} setMode={filters.setMode} queryValue={filters.queryValue} selectedTab={filters.selectedTab} sortSelected={filters.sortSelected} onQueryChange={filters.onQueryChange} onQueryClear={filters.onQueryClear} onTabChange={filters.onTabChange} onSort={filters.setSortSelected} onNavigate={(id) => navigate(`/app/rules/${id}`)} onDuplicate={(id) => submitAction("duplicate", [id])} onDelete={setRuleToDelete} onBulkAction={(intent) => submitAction(intent, selectedResources)} />
        )}
      </Card>
      <DeleteRuleModal open={ruleToDelete !== null} loading={isDeleting} onClose={() => !isDeleting && setRuleToDelete(null)} onConfirm={() => { if (!ruleToDelete) return; setIsDeleting(true); submitAction("remove", [ruleToDelete.id]); }} />
    </Page>
  );
}
