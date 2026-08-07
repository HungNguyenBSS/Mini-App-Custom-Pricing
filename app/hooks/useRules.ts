// app/hooks/useRules.ts
import { useCallback, useEffect, useState } from "react";
import { api } from "../mock/api";
import type { Rule } from "../types";

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await api.listRules();
    setRules(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const duplicate = useCallback(
    async (id: string) => {
      await api.duplicateRule(id);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.removeRule(id);
      await reload();
    },
    [reload]
  );

  return { rules, loading, reload, duplicate, remove };
}