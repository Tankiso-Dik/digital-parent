import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFamilyStore, useHasHydrated } from "./family-store";

describe("family-store migration shim", () => {
  it("is always hydrated because family data no longer boots from localStorage", () => {
    const { result } = renderHook(() => useHasHydrated());

    expect(result.current).toBe(true);
  });

  it("keeps a no-op compatibility surface for older tests and helpers", () => {
    useFamilyStore.setState({ _hasHydrated: false });

    expect(useFamilyStore.getState()._hasHydrated).toBe(true);
  });
});
