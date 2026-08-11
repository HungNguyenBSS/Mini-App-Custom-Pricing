import { useEffect, useMemo, useState } from "react";
import {
  Card,
  FormLayout,
  TextField,
  Select,
  RadioButton,
  Tag,
  InlineStack,
  BlockStack,
  Button,
  IndexTable,
  Text,
  Layout,
  Thumbnail,
  PageActions,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { api } from "../mock/api";
import type { PriceType, Product, Rule } from "../types";

interface Props {
  initial?: Rule;
  products: Product[];
  onSubmit: (
    data: Omit<Rule, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  submitLabel: string;
}

function computeModifiedPrice(
  original: number,
  priceType: PriceType,
  amount: number,
) {
  if (priceType === "fixed") return amount;
  if (priceType === "decrease_amount") return Math.max(0, original - amount);
  if (priceType === "decrease_percent")
    return Math.max(0, original - (original * amount) / 100);
  return original;
}

export function RuleForm({ initial, products, onSubmit, submitLabel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<Rule["status"]>(
    initial?.status ?? "enable",
  );
  const [applyTo, setApplyTo] = useState<Rule["applyTo"]>(
    initial?.applyTo ?? "all",
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [priceType, setPriceType] = useState<PriceType>(
    initial?.priceType ?? "fixed",
  );
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [showPricing, setShowPricing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    amount: false,
    tags: false,
  });

  const commitTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((current) => [...current, trimmed]);
    }
    setTagInput("");
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && tagInput.trim()) {
      event.preventDefault();
      commitTag(tagInput);
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const relevantProducts = useMemo(() => {
    if (applyTo === "all") return products;

    const normalizedTags = tags.map((tag) => tag.toLowerCase());
    return products.filter((product) =>
      product.tags.some((tag) => normalizedTags.includes(tag.toLowerCase())),
    );
  }, [applyTo, products, tags]);

  const rowMarkup = relevantProducts.map((p, index) => (
    <IndexTable.Row id={p.id} key={p.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {p.id}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Thumbnail source={p.image || ImageIcon} alt={p.title} size="small" />
      </IndexTable.Cell>
      <IndexTable.Cell>{p.title}</IndexTable.Cell>
      <IndexTable.Cell>${p.originalPrice.toFixed(2)}</IndexTable.Cell>
      <IndexTable.Cell>
        ${computeModifiedPrice(p.originalPrice, priceType, Number(amount) || 0).toFixed(2)}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));
  const amountValue = Number(amount);
  const amountError =
    amount.trim() === ""
      ? "Amount is required"
      : Number.isNaN(amountValue) || amountValue < 0
        ? "Amount must be 0 or greater"
        : priceType === "decrease_percent" && amountValue > 100
          ? "Percentage discount cannot exceed 100%"
          : undefined;
  const tagsError =
    applyTo === "tags" && tags.length === 0 && tagInput.trim() === ""
      ? "Add at least one product tag"
      : undefined;
  const nameError = name.trim() === "" ? "Name is required" : undefined;
  const showNameError = (touchedFields.name || submitAttempted) && nameError;
  const showAmountError =
    (touchedFields.amount || submitAttempted) && amountError;
  const showTagsError = (touchedFields.tags || submitAttempted) && tagsError;
  const canSubmit = !name.trim() || amountError || tagsError || isSubmitting;

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    if (canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        status,
        priority: initial?.priority ?? 0,
        applyTo,
        tags,
        priceType,
        amount: amountValue,
        productIds: relevantProducts.map((p) => p.id),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Layout.AnnotatedSection title="General Information">
        <Card>
          <FormLayout>
            <TextField
              label="Name"
              value={name}
              onChange={(value) => {
                setName(value);
                setTouchedFields((current) => ({ ...current, name: true }));
              }}
              autoComplete="off"
              requiredIndicator
              error={showNameError}
            />
            <Select
              label="Status"
              options={[
                { label: "Enable", value: "enable" },
                { label: "Disable", value: "disable" },
              ]}
              value={status}
              onChange={(v) => setStatus(v as Rule["status"])}
            />
          </FormLayout>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.AnnotatedSection title="Apply to Products">
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <RadioButton
                label="All products"
                checked={applyTo === "all"}
                id="apply-all"
                name="applyTo"
                onChange={() => {
                  setApplyTo("all");
                  // setTouchedFields((current) => ({ ...current, tags: true }));
                }}
              />
              <RadioButton
                label="Product tags"
                checked={applyTo === "tags"}
                id="apply-tags"
                name="applyTo"
                onChange={() => {
                  setApplyTo("tags");
                  // setTouchedFields((current) => ({ ...current, tags: true }));
                }}
              />
            </BlockStack>
            {applyTo === "tags" && (
              <BlockStack gap="200">
                <div onKeyDown={handleAddTag}>
                  <TextField
                    label="Product tags"
                    labelHidden
                    placeholder="Product tags"
                    value={tagInput}
                    onChange={(value) => setTagInput(value)}
                    onBlur={() => {
                      setTouchedFields((current) => ({ ...current, tags: true }));
                      if (tagInput.trim()) commitTag(tagInput);
                    }}
                    autoComplete="off"
                    error={showTagsError}
                  />
                </div>
                {tags.length > 0 && (
                  <InlineStack gap="100">
                    {tags.map((tag) => (
                      <Tag key={tag} onRemove={() => removeTag(tag)}>
                        {tag}
                      </Tag>
                    ))}
                  </InlineStack>
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.AnnotatedSection title="Choose B2B discount type">
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <RadioButton
                label="Apply a price to selected products/variants"
                checked={priceType === "fixed"}
                id="price-fixed"
                name="priceType"
                onChange={() => setPriceType("fixed")}
              />
              <RadioButton
                label="Decrease a fixed amount off the original price"
                checked={priceType === "decrease_amount"}
                id="price-decrease-amount"
                name="priceType"
                onChange={() => setPriceType("decrease_amount")}
              />
              <RadioButton
                label="Decrease the original price by a percentage (%)"
                checked={priceType === "decrease_percent"}
                id="price-decrease-percent"
                name="priceType"
                onChange={() => setPriceType("decrease_percent")}
              />
            </BlockStack>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(value) => {
                setAmount(value);
                setTouchedFields((current) => ({ ...current, amount: true }));
              }}
              autoComplete="off"
              suffix={priceType === "decrease_percent" ? "%" : undefined}
              helpText="The price will be adjusted based on your Shopify Markets setting"
              error={showAmountError}
            />
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.AnnotatedSection
        title={
          <Text as="h2" variant="headingMd">
            Apply a price to selected products/variants for All customers.
          </Text>
        }
      >
        <Card>
          <BlockStack gap="400">
            <InlineStack>
              <Button onClick={() => setShowPricing((s) => !s)}>
                {showPricing ? "Hide" : "Show"} product pricing details
              </Button>
            </InlineStack>
            {showPricing && (
              <IndexTable
                resourceName={{ singular: "product", plural: "products" }}
                itemCount={relevantProducts.length}
                headings={[
                  { title: "ID" },
                  { title: "Image" },
                  { title: "Title" },
                  { title: "Original Price" },
                  { title: "Modified Price" },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.Section>
        <PageActions
          primaryAction={{
            content: submitLabel,
            disabled: Boolean(canSubmit),
            loading: isSubmitting,
            onAction: handleSubmit,
          }}
        />
      </Layout.Section>
    </Layout>
  );
}
