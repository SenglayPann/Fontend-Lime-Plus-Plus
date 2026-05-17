"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useDebouncedSearchParam(
  value: string,
  paramName = "search",
  delay = 300,
) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  useEffect(() => {
    const nextValue = debouncedValue.trim();
    const params = new URLSearchParams(serializedSearchParams);
    const currentValue = params.get(paramName) || "";

    if (currentValue === nextValue) return;

    if (nextValue) {
      params.set(paramName, nextValue);
    } else {
      params.delete(paramName);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [debouncedValue, paramName, pathname, router, serializedSearchParams]);

  return debouncedValue;
}
