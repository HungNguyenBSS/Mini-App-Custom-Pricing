import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  useIndexResourceState,
} from "@shopify/polaris";
import { useRules } from "../hooks/useRules";

export default function RulesIndex() {
  const { rules, loading, duplicate, remove } = useRules();
  const navigate = useNavigate();
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rules);

  const rows = rules.map((rule, index) => (
    <IndexTable.Row
      id={rule.id}
      key={rule.id}
      selected={selectedResources.includes(rule.id)}
      position={index}
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
        <ButtonGroup>
          <Button
            icon="EditMinor"
            onClick={() => navigate(`/app/rules/${rule.id}`)}
          >
            Edit
          </Button>
          <Button onClick={() => duplicate(rule.id)}>Duplicate</Button>
          <Button
            tone="critical"
            onClick={() => {
              if (confirm(`Xoá rule "${rule.name}"?`)) remove(rule.id);
            }}
          >
            Remove
          </Button>
        </ButtonGroup>
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
            action={{ content: "Add rule", url: "/app/rules/new" }}
            image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
          >
            <p>Tạo rule giảm giá đầu tiên cho tệp khách hàng cụ thể.</p>
          </EmptyState>
        ) : (
          <IndexTable
            resourceName={{ singular: "rule", plural: "rules" }}
            itemCount={rules.length}
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
        )}
      </Card>
    </Page>
  );
}