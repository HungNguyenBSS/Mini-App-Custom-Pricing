// app/routes/app.rules.new.tsx
import { useNavigate } from "react-router";
import { Page } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { api } from "../mock/api";

export default function NewRule() {
  const navigate = useNavigate();
  return (
    <Page title="Create custom pricing rule" backAction={{ url: "/app/rules" }}>
      <RuleForm
        submitLabel="Create rule"
        onSubmit={async (data) => {
          await api.createRule(data);
          navigate("/app/rules");
        }}
      />
    </Page>
  );
}