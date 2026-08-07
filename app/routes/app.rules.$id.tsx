// app/routes/app.rules.$id.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Page, Spinner } from "@shopify/polaris";
import { RuleForm } from "../components/RuleForm";
import { api } from "../mock/api";
import type { Rule } from "../types";

export default function EditRule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule | undefined>();

  useEffect(() => {
    if (id) api.getRule(id).then(setRule);
  }, [id]);

  if (!rule) return <Spinner accessibilityLabel="Loading rule" />;

  return (
    <Page
      title={`Edit custom pricing rule "${rule.name}"`}
      backAction={{ url: "/app/rules" }}
    >
      <RuleForm
        initial={rule}
        submitLabel="Save changes"
        onSubmit={async (data) => {
          await api.updateRule(rule.id, data);
          navigate("/app/rules");
        }}
      />
    </Page>
  );
}