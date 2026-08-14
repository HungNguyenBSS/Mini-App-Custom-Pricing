import { BlockStack, Button, IndexTable, InlineStack, Pagination, Text, Thumbnail } from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import type { PriceType, Product } from "../../types";
import { computeModifiedPrice, shortenGid } from "./ruleForm.utils";

interface Props {
  products: Product[];
  priceType: PriceType;
  amount: string;
  page: number;
  totalPages: number;
  visible: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function ProductPricingPreview({ products, priceType, amount, page, totalPages, visible, onToggle, onPrevious, onNext }: Props) {
  return (
    <BlockStack gap="400">
      <InlineStack><Button onClick={onToggle}>{visible ? "Hide" : "Show"} product pricing details</Button></InlineStack>
      {visible && (
        <BlockStack gap="200">
          <IndexTable resourceName={{ singular: "product", plural: "products" }} itemCount={products.length} headings={[{ title: "ID" }, { title: "Image" }, { title: "Title" }, { title: "Original Price" }, { title: "Modified Price" }]} selectable={false}>
            {products.map((product, index) => (
              <IndexTable.Row id={product.id} key={product.id} position={index}>
                <IndexTable.Cell><Text as="span" variant="bodyMd">{shortenGid(product.id)}</Text></IndexTable.Cell>
                <IndexTable.Cell><Thumbnail source={product.image || ImageIcon} alt={product.title} size="small" /></IndexTable.Cell>
                <IndexTable.Cell>{product.title}</IndexTable.Cell>
                <IndexTable.Cell>${product.originalPrice.toFixed(2)}</IndexTable.Cell>
                <IndexTable.Cell>${computeModifiedPrice(product.originalPrice, priceType, Number(amount) || 0).toFixed(2)}</IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
          {totalPages > 1 && <InlineStack align="center"><Pagination hasPrevious={page > 0} onPrevious={onPrevious} hasNext={page < totalPages - 1} onNext={onNext} label={`Page ${page + 1} of ${totalPages}`} /></InlineStack>}
        </BlockStack>
      )}
    </BlockStack>
  );
}
