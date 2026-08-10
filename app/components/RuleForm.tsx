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
  DataTable,
  Text,
} from "@shopify/polaris";
import { api } from "../mock/api";
import type { PriceType, Product, Rule } from "../types";

interface Props {
  initial?: Rule;
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

export function RuleForm({ initial, onSubmit, submitLabel }: Props) {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    amount: false,
    tags: false,
  });

  useEffect(() => {
    api.listProducts().then(setProducts);
  }, []);

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && tagInput.trim()) {
      event.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
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

  const pricingRows = relevantProducts.map((p) => [
    p.title,
    `$${computeModifiedPrice(p.originalPrice, priceType, Number(amount) || 0).toFixed(2)}`,
  ]);
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
    applyTo === "tags" && tags.length === 0
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
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            General information
          </Text>
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
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Apply to Products
          </Text>
          <RadioButton
            label="All products"
            checked={applyTo === "all"}
            id="apply-all"
            name="applyTo"
            onChange={() => {
              setApplyTo("all");
              setTouchedFields((current) => ({ ...current, tags: true }));
            }}
          />
          <RadioButton
            label="Product tags"
            checked={applyTo === "tags"}
            id="apply-tags"
            name="applyTo"
            onChange={() => {
              setApplyTo("tags");
              setTouchedFields((current) => ({ ...current, tags: true }));
            }}
          />
          {applyTo === "tags" && (
            <BlockStack gap="200">
              <div onKeyDown={handleAddTag}>
                <TextField
                  label="Product tags"
                  labelHidden
                  placeholder="Nhap tag roi nhan Enter"
                  value={tagInput}
                  onChange={(value) => {
                    setTagInput(value);
                    setTouchedFields((current) => ({
                      ...current,
                      tags: true,
                    }));
                  }}
                  autoComplete="off"
                  error={showTagsError}
                />
              </div>
              <InlineStack gap="100">
                {tags.map((tag) => (
                  <Tag key={tag} onRemove={() => removeTag(tag)}>
                    {tag}
                  </Tag>
                ))}
              </InlineStack>
            </BlockStack>
          )}
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            Custom Prices
          </Text>
          <RadioButton
            label="Apply a price to selected products"
            checked={priceType === "fixed"}
            id="price-fixed"
            name="priceType"
            onChange={() => setPriceType("fixed")}
          />
          <RadioButton
            label="Decrease a fixed amount of the original prices"
            checked={priceType === "decrease_amount"}
            id="price-decrease-amount"
            name="priceType"
            onChange={() => setPriceType("decrease_amount")}
          />
          <RadioButton
            label="Decrease the original prices by a percentage (%)"
            checked={priceType === "decrease_percent"}
            id="price-decrease-percent"
            name="priceType"
            onChange={() => setPriceType("decrease_percent")}
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(value) => {
              setAmount(value);
              setTouchedFields((current) => ({ ...current, amount: true }));
            }}
            autoComplete="off"
            prefix={priceType !== "decrease_percent" ? "$" : undefined}
            suffix={priceType === "decrease_percent" ? "%" : undefined}
            error={showAmountError}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Button onClick={() => setShowPricing((s) => !s)}>
            {showPricing ? "Hide" : "Show"} product pricing details
          </Button>
          {showPricing && (
            <DataTable
              columnContentTypes={["text", "text"]}
              headings={["Title", "Modified Price"]}
              rows={pricingRows}
            />
          )}
        </BlockStack>
      </Card>

      <Button
        variant="primary"
        disabled={Boolean(canSubmit)}
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {submitLabel}
      </Button>
    </BlockStack>
  );
}
