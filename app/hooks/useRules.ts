import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.client";
import type { Rule } from "../types";

export function useRules(shopDomain: string) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, pagination } = await api.listRules(shopDomain, page);
      setRules(data);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Failed to load rules:", error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [shopDomain, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rules, loading, reload, page, setPage, totalPages };
}