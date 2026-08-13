import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.client";
import type { Rule } from "../types";

export function useRules(shopDomain: string) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listRules(shopDomain);
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [shopDomain]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rules, loading, reload };
}