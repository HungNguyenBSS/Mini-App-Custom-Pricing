// app/routes/app.rules.new.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { Banner, Page } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { api } from "../mock/api";

export default function NewRule() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <Page title="Create custom pricing rule" backAction={{ url: "/app/rules" }}>
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}
      <RuleForm
        submitLabel="Create rule"
        onSubmit={async (data) => {
          try {
            await api.createRule(data);
            navigate("/app/rules");
          } catch {
            setError("Could not create rule. Please try again.");
          }
        }}
      />
    </Page>
  );
}
