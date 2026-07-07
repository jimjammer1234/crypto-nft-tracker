import { useEffect, useState, useCallback } from "react";
import { api, type AlertRuleRow, type AlertEventRow } from "../lib/apiClient.js";

const REFRESH_MS = 30_000;

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRuleRow[]>([]);

  const reload = useCallback(async () => {
    try {
      setRules(await api.getAlertRules());
    } catch {
      // transient fetch errors are fine; the next poll retries
    }
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, REFRESH_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return { rules, reload };
}

export function useAlertEvents() {
  const [events, setEvents] = useState<AlertEventRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getAlertEvents(100);
        if (!cancelled) setEvents(data);
      } catch {
        // transient fetch errors are fine; the next poll retries
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return events;
}
