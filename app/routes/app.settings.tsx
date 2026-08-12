// app/routes/app.settings.tsx
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  Page,
  Card,
  TextField,
  Text,
  InlineStack,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchShopData, updateSenderEmail } from "../store/shopSlice";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shopDomain: session.shop };
};

export default function Settings() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const dispatch = useAppDispatch();
  const shop = useAppSelector((s) => s.shop.data);
  const loading = useAppSelector((s) => s.shop.loading);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    dispatch(fetchShopData(shopDomain));
  }, [dispatch, shopDomain]);

  useEffect(() => {
    if (shop) {
      setEmail(shop.senderEmail);
      setEnabled(shop.senderEmailEnabled);
    }
  }, [shop]);

  const handleToggle = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    dispatch(updateSenderEmail({ shopDomain, email, enabled: nextEnabled }));
  };

  const handleSave = () => {
    dispatch(updateSenderEmail({ shopDomain, email, enabled }));
  };

  return (
    <Page title="Settings">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <div>
              <Text as="p" fontWeight="medium">
                Allow the app to send information via email
              </Text>
              <Text as="p" tone="subdued">
                All updates and notifications will be sent to:{" "}
                {shop?.senderEmail}
              </Text>
            </div>
            <Button loading={loading} onClick={handleToggle}>
              {enabled ? "On" : "Off"}
            </Button>
          </InlineStack>
          {enabled && (
            <TextField
              label="Sender email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="off"
              connectedRight={
                <Button loading={loading} onClick={handleSave}>
                  Save
                </Button>
              }
            />
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}