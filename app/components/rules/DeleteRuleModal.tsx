import { Modal } from "@shopify/polaris";

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteRuleModal({ open, loading, onClose, onConfirm }: Props) {
  return <Modal open={open} onClose={onClose} title="Delete rule" primaryAction={{ content: "Delete", loading, onAction: onConfirm }} secondaryActions={[{ content: "Cancel", disabled: loading, onAction: onClose }]}><Modal.Section><p>This can&apos;t be undone.</p></Modal.Section></Modal>;
}
