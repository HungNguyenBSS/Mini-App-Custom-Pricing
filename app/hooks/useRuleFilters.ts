import { useCallback, useEffect, useMemo, useState } from "react";
import { IndexFiltersMode, useSetIndexFiltersMode } from "@shopify/polaris";
import type { Rule } from "../types";

export function useRuleFilters(rules: Rule[]) {
  const { mode, setMode } = useSetIndexFiltersMode(IndexFiltersMode.Default);
  const [queryValue, setQueryValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortSelected, setSortSelected] = useState(["createdAt asc"]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(queryValue), 500);
    return () => clearTimeout(timer);
  }, [queryValue]);

  const onQueryChange = useCallback((value: string) => setQueryValue(value), []);
  const onQueryClear = useCallback(() => {
    setQueryValue("");
    setDebouncedQuery("");
  }, []);
  const onTabChange = useCallback((selectedTabIndex: number) => setSelectedTab(selectedTabIndex), []);

  const sortedRules = useMemo(() => {
    const filteredRules = debouncedQuery
      ? rules.filter((rule) => rule.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
      : rules;
    const [field, direction] = sortSelected[0].split(" ");
    const sorted = [...filteredRules].sort((a, b) => {
      if (field === "name") return a.name.localeCompare(b.name);
      if (field === "createdAt") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [debouncedQuery, rules, sortSelected]);

  return { mode, setMode, queryValue, selectedTab, sortSelected, sortedRules, onQueryChange, onQueryClear, onTabChange, setSortSelected };
}
