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
  Pagination,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import type { PriceType, Product, Rule } from "../types";

interface Props {
  initial?: Rule;
  products: Product[];
  onSubmit: (
    data: Omit<Rule, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  submitLabel: string;
  submitting?: boolean;
}

const PAGE_SIZE = 10;

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

function shortenGid(gid: string) {
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

export function RuleForm({
  initial,
  products,
  onSubmit,
  submitLabel,
  submitting,
}: Props) {
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
  const [pricingPage, setPricingPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    amount: false,
    tags: false,
  });

  // Ưu tiên trạng thái loading do route cha điều khiển (fetcher), fallback về state nội bộ
  const effectiveSubmitting = submitting ?? isSubmitting;

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
    return products.filter((product) => {
      const productTags = product.tags.map((tag) => tag.toLowerCase());
      return normalizedTags.every((tag) => productTags.includes(tag));
    });
  }, [applyTo, products, tags]);

  // Reset về trang đầu khi danh sách sản phẩm liên quan thay đổi (đổi tag/applyTo)
  useEffect(() => {
    setPricingPage(0);
  }, [relevantProducts]);

  const totalPages = Math.max(
    1,
    Math.ceil(relevantProducts.length / PAGE_SIZE),
  );

  const pagedProducts = useMemo(() => {
    const start = pricingPage * PAGE_SIZE;
    return relevantProducts.slice(start, start + PAGE_SIZE);
  }, [relevantProducts, pricingPage]);

  const rowMarkup = pagedProducts.map((p, index) => (
    <IndexTable.Row id={p.id} key={p.id} position={index}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {shortenGid(p.id)}
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
  const canSubmit =
    !name.trim() || amountError || tagsError || effectiveSubmitting;

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
                onChange={() => setApplyTo("all")}
              />
              <RadioButton
                label="Product tags"
                checked={applyTo === "tags"}
                id="apply-tags"
                name="applyTo"
                onChange={() => setApplyTo("tags")}
              />
            </BlockStack>
            {applyTo === "tags" && (
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="start" wrap={false}>
                  <div style={{ flex: 1 }} onKeyDown={handleAddTag}>
                    <TextField
                      label="Product tags"
                      labelHidden
                      placeholder="Product tags"
                      value={tagInput}
                      onChange={(value) => setTagInput(value)}
                      onBlur={() => {
                        setTouchedFields((current) => ({
                          ...current,
                          tags: true,
                        }));
                      }}
                      autoComplete="off"
                      error={showTagsError}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setTouchedFields((current) => ({
                        ...current,
                        tags: true,
                      }));
                      if (tagInput.trim()) commitTag(tagInput);
                    }}
                    disabled={!tagInput.trim()}
                  >
                    Add tag
                  </Button>
                </InlineStack>
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
              <BlockStack gap="200">
                <IndexTable
                  resourceName={{ singular: "product", plural: "products" }}
                  itemCount={pagedProducts.length}
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
                {totalPages > 1 && (
                  <InlineStack align="center">
                    <Pagination
                      hasPrevious={pricingPage > 0}
                      onPrevious={() => setPricingPage((p) => p - 1)}
                      hasNext={pricingPage < totalPages - 1}
                      onNext={() => setPricingPage((p) => p + 1)}
                      label={`Page ${pricingPage + 1} of ${totalPages}`}
                    />
                  </InlineStack>
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>

      <Layout.Section>
        <PageActions
          primaryAction={{
            content: submitLabel,
            disabled: Boolean(canSubmit),
            loading: effectiveSubmitting,
            onAction: handleSubmit,
          }}
        />
      </Layout.Section>
    </Layout>
  );
}