// app/routes/app.settings.tsx
import { useEffect, useState } from "react";
import { Page, Card, TextField, Text, InlineStack, Button } from "@shopify/polaris";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchShopData, updateSenderEmail } from "../store/shopSlice";

export default function Settings() {
  const dispatch = useAppDispatch();
  const shop = useAppSelector((s) => s.shop.data);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchShopData());
  }, [dispatch]);

  useEffect(() => {
    if (shop) {
      setEmail(shop.senderEmail);
      setEnabled(shop.senderEmailEnabled);
    }
  }, [shop]);

  return (
    <Page title="Settings">
      <Card>
        <InlineStack align="space-between" blockAlign="center">
          <div>
            <Text as="p" fontWeight="medium">
              Allow the app to send information via email
            </Text>
            <Text as="p" tone="subdued">
              All updates and notifications will be sent to: {shop?.senderEmail}
            </Text>
          </div>
          <Button onClick={() => setEnabled((v) => !v)}>
            {enabled ? "On" : "Off"}
          </Button>
        </InlineStack>
        {enabled && (
          <div style={{ marginTop: 16 }}>
            <TextField
              label="Sender email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="off"
              connectedRight={
                <Button
                  onClick={() =>
                    dispatch(updateSenderEmail({ email, enabled }))
                  }
                >
                  Save
                </Button>
              }
            />
          </div>
        )}
      </Card>
    </Page>
  );
}