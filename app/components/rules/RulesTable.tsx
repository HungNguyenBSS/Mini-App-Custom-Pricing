import { Badge, Button, ButtonGroup, IndexFilters, IndexTable, IndexFiltersMode, useIndexResourceState } from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import type { Rule } from "../../types";
import { formatDateTime } from "./rulesList.utils";

interface Props {
  rules: Rule[];
  loading: boolean;
  selectedResources: string[];
  allResourcesSelected: boolean;
  onSelectionChange: ReturnType<typeof useIndexResourceState>["handleSelectionChange"];
  mode: IndexFiltersMode;
  setMode: (mode: IndexFiltersMode) => void;
  queryValue: string;
  selectedTab: number;
  sortSelected: string[];
  onQueryChange: (value: string) => void;
  onQueryClear: () => void;
  onTabChange: (value: number) => void;
  onSort: (value: string[]) => void;
  onNavigate: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (rule: Pick<Rule, "id" | "name">) => void;
  onBulkAction: (intent: "enable" | "disable" | "remove") => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function RulesTable({ rules, loading, selectedResources, allResourcesSelected, onSelectionChange, mode, setMode, queryValue, selectedTab, sortSelected, onQueryChange, onQueryClear, onTabChange, onSort, onNavigate, onDuplicate, onDelete, onBulkAction, page, totalPages, setPage }: Props) {
  return (
    <>
      <IndexFilters sortOptions={[{ label: "Name", value: "name asc", directionLabel: "A-Z" }, { label: "Name", value: "name desc", directionLabel: "Z-A" }, { label: "Created Date", value: "createdAt asc", directionLabel: "Ascending" }, { label: "Created Date", value: "createdAt desc", directionLabel: "Descending" }]} sortSelected={sortSelected} queryValue={queryValue} queryPlaceholder="Searching in all" onQueryChange={onQueryChange} onQueryClear={onQueryClear} onSort={onSort} cancelAction={{ onAction: onQueryClear, disabled: false, loading: false }} tabs={[{ content: "All", id: "all" }]} selected={selectedTab} onSelect={onTabChange} filters={[]} appliedFilters={[]} onClearAll={() => {}} mode={mode} setMode={setMode} canCreateNewView={false} hideFilters />
      <IndexTable pagination={{ hasNext: page < totalPages, hasPrevious: page > 1, onNext: () => setPage(page + 1), onPrevious: () => setPage(page - 1) }} resourceName={{ singular: "rule", plural: "rules" }} itemCount={rules.length} selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length} onSelectionChange={onSelectionChange} loading={loading} bulkActions={[{ content: "Enable", onAction: () => onBulkAction("enable") }, { content: "Disable", onAction: () => onBulkAction("disable") }, { content: "Delete", onAction: () => onBulkAction("remove") }]} headings={[{ title: "Name" }, { title: "Status" }, { title: "Priority" }, { title: "Created Date" }, { title: "Updated Date" }, { title: "Action" }]}>
        {rules.map((rule, index) => (
          <IndexTable.Row id={rule.id} key={rule.id} selected={selectedResources.includes(rule.id)} position={index} onClick={() => { const selection = window.getSelection(); if (selection && selection.toString().length > 0) return; onNavigate(rule.id); }}>
            <IndexTable.Cell>{rule.name}</IndexTable.Cell>
            <IndexTable.Cell><Badge tone={rule.status === "enable" ? "success" : "critical"}>{rule.status === "enable" ? "Enable" : "Disable"}</Badge></IndexTable.Cell>
            <IndexTable.Cell>{rule.priority}</IndexTable.Cell>
            <IndexTable.Cell>{formatDateTime(rule.createdAt)}</IndexTable.Cell>
            <IndexTable.Cell>{formatDateTime(rule.updatedAt)}</IndexTable.Cell>
            <IndexTable.Cell><div onClick={(event) => event.stopPropagation()}><ButtonGroup><Button icon={EditIcon} onClick={() => onNavigate(rule.id)}>Edit</Button><Button onClick={() => onDuplicate(rule.id)}>Duplicate</Button><Button tone="critical" onClick={() => onDelete(rule)}>Remove</Button></ButtonGroup></div></IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </>
  );
}
