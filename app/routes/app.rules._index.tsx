import { useState, useCallback, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useNavigate, useLoaderData, useFetcher } from "react-router";
import {
  Page, Card, IndexTable, Badge, Button, ButtonGroup, EmptyState, Modal,
  useIndexResourceState, IndexFilters, useSetIndexFiltersMode, IndexFiltersMode,
} from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import { useRules } from "../hooks/useRules";
import { authenticate } from "../shopify.server";
import { syncRulesToMetafield } from "../services/pricing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shopDomain: session.shop };
};

type ActionResult = { ok: true } | { ok: false; error: string };

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  try {
    if (intent === "duplicate") {
      const res = await fetch(`${process.env.BACKEND_URL}/rules/${id}/duplicate`, {
        method: "POST",
        headers: { "x-shop-domain": session.shop },
      });
      if (!res.ok) return { ok: false, error: "Could not duplicate rule." };
    } else if (intent === "remove") {
      const res = await fetch(`${process.env.BACKEND_URL}/rules/${id}`, {
        method: "DELETE",
        headers: { "x-shop-domain": session.shop },
      });
      if (!res.ok) return { ok: false, error: "Could not delete rule." };
    } else {
      return { ok: false, error: "Unknown action." };
    }

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
  const navigate = useNavigate();
  const actionFetcher = useFetcher<typeof action>();
  const [ruleToDelete, setRuleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search state
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Default);
  const [queryValue, setQueryValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortSelected, setSortSelected] = useState(["name asc"]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [queryValue]);

  const onQueryChange = useCallback((value: string) => setQueryValue(value), []);
  const onQueryClear = useCallback(() => {
    setQueryValue("");
    setDebouncedQuery("");
  }, []);
  const onTabChange = useCallback((selectedTabIndex: number) => setSelectedTab(selectedTabIndex), []);

  const filteredRules = debouncedQuery
    ? rules.filter((rule) => rule.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : rules;

  const ruleResources = filteredRules.map((rule) => ({ id: rule.id }));
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(ruleResources);

  // Sau khi action (duplicate/remove) hoàn tất thành công, load lại danh sách
  useEffect(() => {
    if (actionFetcher.data?.ok) {
      reload();
    }
  }, [actionFetcher.data, reload]);

  const handleDuplicate = (id: string) => {
    actionFetcher.submit({ intent: "duplicate", id }, { method: "post" });
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    setIsDeleting(true);
    actionFetcher.submit(
      { intent: "remove", id: ruleToDelete.id },
      { method: "post" },
    );
  };

  // Đóng modal + tắt loading khi action xoá đã trả kết quả
  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data && isDeleting) {
      setIsDeleting(false);
      if (actionFetcher.data.ok) {
        setRuleToDelete(null);
      }
    }
  }, [actionFetcher.state, actionFetcher.data, isDeleting]);

  const rows = filteredRules.map((rule, index) => (
    <IndexTable.Row
      id={rule.id}
      key={rule.id}
      selected={selectedResources.includes(rule.id)}
      position={index}
      onClick={() => navigate(`/app/rules/${rule.id}`)}
    >
      <IndexTable.Cell>{rule.name}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={rule.status === "enable" ? "success" : "critical"}>
          {rule.status === "enable" ? "Enable" : "Disable"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{rule.priority}</IndexTable.Cell>
      <IndexTable.Cell>{rule.createdAt}</IndexTable.Cell>
      <IndexTable.Cell>{rule.updatedAt}</IndexTable.Cell>
      <IndexTable.Cell>
        <div onClick={(event) => event.stopPropagation()}>
          <ButtonGroup>
            <Button
              icon={EditIcon}
              onClick={() => navigate(`/app/rules/${rule.id}`)}
            >
              Edit
            </Button>
            <Button onClick={() => handleDuplicate(rule.id)}>Duplicate</Button>
            <Button
              tone="critical"
              onClick={() => setRuleToDelete({ id: rule.id, name: rule.name })}
            >
              Remove
            </Button>
          </ButtonGroup>
        </div>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Configuration"
      primaryAction={{
        content: "Add rule",
        onAction: () => navigate("/app/rules/new"),
      }}
    >
      <Card padding="0">
        {rules.length === 0 && !loading ? (
          <EmptyState
            heading="Chưa có rule nào"
            action={{ content: "Add rule", onAction: () => navigate("/app/rules/new") }}
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
          >
            <p>Tạo rule giảm giá đầu tiên cho tệp khách hàng cụ thể.</p>
          </EmptyState>
        ) : (
          <>
            <IndexFilters
              sortOptions={[
                { label: "Name A-Z", value: "name asc", directionLabel: "A-Z" },
                { label: "Name Z-A", value: "name desc", directionLabel: "Z-A" },
              ]}
              sortSelected={sortSelected}
              queryValue={queryValue}
              queryPlaceholder="Searching in all"
              onQueryChange={onQueryChange}
              onQueryClear={onQueryClear}
              onSort={setSortSelected}
              cancelAction={{
                onAction: onQueryClear,
                disabled: false,
                loading: false,
              }}
              tabs={[{ content: "All", id: "all" }]}
              selected={selectedTab}
              onSelect={onTabChange}
              filters={[]}
              appliedFilters={[]}
              onClearAll={() => {}}
              mode={mode}
              setMode={setMode}
              canCreateNewView={false}
              hideFilters
            />
            <IndexTable
              resourceName={{ singular: "rule", plural: "rules" }}
              itemCount={filteredRules.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              loading={loading}
              headings={[
                { title: "Name" },
                { title: "Status" },
                { title: "Priority" },
                { title: "Created Date" },
                { title: "Updated Date" },
                { title: "Action" },
              ]}
            >
              {rows}
            </IndexTable>
          </>
        )}
      </Card>
      <Modal
        open={ruleToDelete !== null}
        onClose={() => !isDeleting && setRuleToDelete(null)}
        title="Delete rule"
        primaryAction={{
          content: "Delete",
          loading: isDeleting,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            disabled: isDeleting,
            onAction: () => setRuleToDelete(null),
          },
        ]}
      >
        <Modal.Section>
          <p>This can't be undone.</p>
        </Modal.Section>
      </Modal>
    </Page>
  );
}