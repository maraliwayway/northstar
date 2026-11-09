import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const call = ++latest.current;
    setLoading(true);
    try {
      const result = await api.get<T>(path);
      if (call === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (call === latest.current) setError((e as Error).message);
    } finally {
      if (call === latest.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

// CRUD helpers for a Rails resource, e.g. useCollection<Debt>("/debts", "debt").
export function useCollection<T extends { id: number }>(path: string, param: string) {
  const state = useApi<T[]>(path);
  const { reload } = state;

  const create = useCallback(
    async (attrs: Partial<T> | Record<string, unknown>) => {
      const record = await api.post<T>(path, { [param]: attrs });
      await reload();
      return record;
    },
    [path, param, reload],
  );

  const update = useCallback(
    async (id: number, attrs: Partial<T> | Record<string, unknown>, extra: Record<string, unknown> = {}) => {
      const record = await api.patch<T>(`${path}/${id}`, { [param]: attrs, ...extra });
      await reload();
      return record;
    },
    [path, param, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      await api.del(`${path}/${id}`);
      await reload();
    },
    [path, reload],
  );

  return { ...state, items: state.data ?? [], create, update, remove };
}

export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
