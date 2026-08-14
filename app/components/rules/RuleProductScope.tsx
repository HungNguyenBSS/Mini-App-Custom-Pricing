import { BlockStack, Button, InlineStack, RadioButton, Tag, TextField } from "@shopify/polaris";
import type { KeyboardEvent } from "react";
import type { Rule } from "../../types";

interface Props {
  applyTo: Rule["applyTo"];
  tagInput: string;
  tags: string[];
  tagsError?: string | false;
  onApplyToChange: (value: Rule["applyTo"]) => void;
  onTagInputChange: (value: string) => void;
  onTagInputBlur: () => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export function RuleProductScope({
  applyTo,
  tagInput,
  tags,
  tagsError,
  onApplyToChange,
  onTagInputChange,
  onTagInputBlur,
  onTagKeyDown,
  onAddTag,
  onRemoveTag,
}: Props) {
  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <RadioButton label="All products" checked={applyTo === "all"} id="apply-all" name="applyTo" onChange={() => onApplyToChange("all")} />
        <RadioButton label="Product tags" checked={applyTo === "tags"} id="apply-tags" name="applyTo" onChange={() => onApplyToChange("tags")} />
      </BlockStack>
      {applyTo === "tags" && (
        <BlockStack gap="200">
          <InlineStack gap="200" blockAlign="start" wrap={false}>
            <div style={{ flex: 1 }} onKeyDown={onTagKeyDown}>
              <TextField label="Product tags" labelHidden placeholder="Product tags" value={tagInput} onChange={onTagInputChange} onBlur={onTagInputBlur} autoComplete="off" error={tagsError} />
            </div>
            <Button onClick={onAddTag} disabled={!tagInput.trim()}>Add tag</Button>
          </InlineStack>
          {tags.length > 0 && (
            <InlineStack gap="100">
              {tags.map((tag) => <Tag key={tag} onRemove={() => onRemoveTag(tag)}>{tag}</Tag>)}
            </InlineStack>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}
