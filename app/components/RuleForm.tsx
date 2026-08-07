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
  onSubmit: (data: Omit<Rule, "id" | "createdAt" | "updatedAt">) => void;
  submitLabel: string;
}

function computeModifiedPrice(
  original: number,
  priceType: PriceType,
  amount: number
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
    initial?.status ?? "enable"
  );
  const [applyTo, setApplyTo] = useState<Rule["applyTo"]>(
    initial?.applyTo ?? "all"
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [priceType, setPriceType] = useState<PriceType>(
    initial?.priceType ?? "fixed"
  );
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [products, setProducts] = useState<Product[]>([]);
  const [showPricing, setShowPricing] = useState(false);

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
    // All products, hoặc lọc theo tag (mock: giả sử tất cả product đều match khi có ít nhất 1 tag)
    return applyTo === "all" ? products : products;
  }, [applyTo, products]);

  const pricingRows = relevantProducts.map((p) => [
    p.title,
    `$${computeModifiedPrice(p.originalPrice, priceType, Number(amount) || 0).toFixed(2)}`,
  ]);

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
              onChange={setName}
              autoComplete="off"
              requiredIndicator
              error={name.trim() === "" ? "Name is required" : undefined}
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
            onChange={() => setApplyTo("all")}
          />
          <RadioButton
            label="Product tags"
            checked={applyTo === "tags"}
            id="apply-tags"
            name="applyTo"
            onChange={() => setApplyTo("tags")}
          />
          {applyTo === "tags" && (
            <BlockStack gap="200">
              <div onKeyDown={handleAddTag}>
                <TextField
                    label="Product tags"
                    labelHidden
                    placeholder="Nhập tag rồi nhấn Enter"
                    value={tagInput}
                    onChange={setTagInput}
                    autoComplete="off"
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
            onChange={setAmount}
            autoComplete="off"
            prefix={priceType !== "decrease_percent" ? "$" : undefined}
            suffix={priceType === "decrease_percent" ? "%" : undefined}
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
        disabled={!name.trim()}
        onClick={() =>
          onSubmit({
            name,
            status,
            priority: initial?.priority ?? 0,
            applyTo,
            tags,
            priceType,
            amount: Number(amount) || 0,
            productIds: relevantProducts.map((p) => p.id),
          })
        }
      >
        {submitLabel}
      </Button>
    </BlockStack>
  );
}