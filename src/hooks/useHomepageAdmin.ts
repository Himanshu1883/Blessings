import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { HomepageContent, HomepageSection } from "@/lib/admin/types";

export function useHomepageAdmin() {
  const [content, setContent] = useState<HomepageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<HomepageContent>("/api/admin/homepage");
      setContent(data ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load homepage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSection = useCallback(async (section: HomepageSection, data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const saved = await api.patch<Record<string, unknown>>(`/api/admin/homepage/${section}`, {
        data,
      });
      setContent((prev) => ({ ...prev, [section]: saved }));
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  return { content, loading, saving, error, reload: load, saveSection };
}
