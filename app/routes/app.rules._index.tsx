import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Page,
  Card,
  IndexTable,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Modal,
  useIndexResourceState,
} from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import { useRules } from "../hooks/useRules";

export default function RulesIndex() {
  const { rules, loading, duplicate, remove } = useRules();
  const navigate = useNavigate();
  const [ruleToDelete, setRuleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const ruleResources = rules.map((rule) => ({ id: rule.id }));
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(ruleResources);

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    setIsDeleting(true);
    try {
      await remove(ruleToDelete.id);
      setRuleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = rules.map((rule, index) => (
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
            <Button onClick={() => duplicate(rule.id)}>Duplicate</Button>
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
          <p>This can’t be undone.</p>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
