import { useState, useCallback, useEffect, useMemo } from "react";
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

function formatDateTime(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const action = async ({ request }: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ids = formData.getAll("id") as string[];

  try {
    if (intent === "duplicate") {
      const res = await fetch(`${process.env.BACKEND_URL}/rules/${ids[0]}/duplicate`, {
        method: "POST",
        headers: { "x-shop-domain": session.shop },
      });
      if (!res.ok) return { ok: false, error: "Could not duplicate rule." };
    } else if (intent === "remove") {
      for (const id of ids) {
        const res = await fetch(`${process.env.BACKEND_URL}/rules/${id}`, {
          method: "DELETE",
          headers: { "x-shop-domain": session.shop },
        });
        if (!res.ok) return { ok: false, error: "Could not delete rule." };
      }
    } else if (intent === "enable" || intent === "disable") {
      const status = intent === "enable" ? "enable" : "disable";
      for (const id of ids) {
        const res = await fetch(`${process.env.BACKEND_URL}/rules/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-shop-domain": session.shop,
          },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) return { ok: false, error: `Could not ${status} rule(s).` };
      }
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
  // Mặc định: rule tạo sớm nhất hiện lên đầu
  const [sortSelected, setSortSelected] = useState(["createdAt asc"]);

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

  const sortedRules = useMemo(() => {
    const [field, direction] = sortSelected[0].split(" ");
    const sorted = [...filteredRules].sort((a, b) => {
      if (field === "name") {
        return a.name.localeCompare(b.name);
      }
      if (field === "createdAt") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [filteredRules, sortSelected]);

  const ruleResources = sortedRules.map((rule) => ({ id: rule.id }));
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(ruleResources);

  // Sau khi action (bulk/duplicate/remove) hoàn tất thành công, load lại danh sách
  useEffect(() => {
    if (actionFetcher.data?.ok) {
      reload();
      clearSelection();
    }
  }, [actionFetcher.data, reload, clearSelection]);

  const handleDuplicate = (id: string) => {
    const formData = new FormData();
    formData.set("intent", "duplicate");
    formData.set("id", id);
    actionFetcher.submit(formData, { method: "post" });
  };

  const handleBulkAction = (intent: "enable" | "disable" | "remove") => {
    const formData = new FormData();
    formData.set("intent", intent);
    selectedResources.forEach((id) => formData.append("id", id));
    actionFetcher.submit(formData, { method: "post" });
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.set("intent", "remove");
    formData.set("id", ruleToDelete.id);
    actionFetcher.submit(formData, { method: "post" });
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

  const rows = sortedRules.map((rule, index) => (
    <IndexTable.Row
      id={rule.id}
      key={rule.id}
      selected={selectedResources.includes(rule.id)}
      position={index}
      onClick={() => {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          return;
        }
        navigate(`/app/rules/${rule.id}`);
      }}
    >
      <IndexTable.Cell>{rule.name}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={rule.status === "enable" ? "success" : "critical"}>
          {rule.status === "enable" ? "Enable" : "Disable"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>{rule.priority}</IndexTable.Cell>
      <IndexTable.Cell>{formatDateTime(rule.createdAt)}</IndexTable.Cell>
      <IndexTable.Cell>{formatDateTime(rule.updatedAt)}</IndexTable.Cell>
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
                { label: "Name", value: "name asc", directionLabel: "A-Z" },
                { label: "Name", value: "name desc", directionLabel: "Z-A" },
                { label: "Created Date", value: "createdAt asc", directionLabel: "Ascending" },
                { label: "Created Date", value: "createdAt desc", directionLabel: "Descending" },
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
              onClearAll={() => { }}
              mode={mode}
              setMode={setMode}
              canCreateNewView={false}
              hideFilters
            />
            <IndexTable
              resourceName={{ singular: "rule", plural: "rules" }}
              itemCount={sortedRules.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              loading={loading}
              bulkActions={[
                {
                  content: "Enable",
                  onAction: () => handleBulkAction("enable"),
                },
                {
                  content: "Disable",
                  onAction: () => handleBulkAction("disable"),
                },
                {
                  content: "Delete",
                  onAction: () => handleBulkAction("remove"),
                },
              ]}
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