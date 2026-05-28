import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  familyKeys,
  useCreateFamily,
  useFamily,
  useSetupComplete,
  useUpdateFamily,
} from "@/api/hooks/use-family";
import { familyService } from "@/api/services";
import { pb } from "@/lib/pb";
import type { FamilyApiResponse, FamilyData } from "@/lib/types";
import { PbProvider } from "@/providers/pb-provider";

const testFamily: FamilyData = {
  id: "family-1",
  name: "Test Family",
  createdAt: "2026-05-28T00:00:00.000Z",
  members: [{ id: "member-1", name: "Alex", color: "coral" }],
};

function createWrapper(queryClient = new QueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PbProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </PbProvider>
    );
  };
}

function signInForTest() {
  const payload = btoa(
    JSON.stringify({
      id: "test-user",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );

  pb.authStore.save(`test.${payload}.sig`, {
    id: "test-user",
    email: "test@digital-parent.local",
  } as never);
}

describe("useFamily PocketBase migration behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pb.authStore.clear();
    localStorage.clear();
  });

  it("fetches family data from the service without localStorage seeding", async () => {
    vi.spyOn(familyService, "getFamily").mockResolvedValue({
      data: testFamily,
    });

    localStorage.setItem(
      "family-hub-family",
      JSON.stringify({ state: { family: { ...testFamily, name: "Stale" } } }),
    );

    const { result } = renderHook(() => useFamily(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.data?.data?.name).toBe("Test Family"),
    );
    expect(familyService.getFamily).toHaveBeenCalledTimes(1);
  });

  it("does not query setup data while signed out", () => {
    const getFamily = vi.spyOn(familyService, "getFamily").mockResolvedValue({
      data: testFamily,
    });

    const { result } = renderHook(() => useSetupComplete(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
    expect(getFamily).not.toHaveBeenCalled();
  });

  it("reports setup complete when PocketBase auth is valid and family has members", async () => {
    signInForTest();
    vi.spyOn(familyService, "getFamily").mockResolvedValue({
      data: testFamily,
    });

    const { result } = renderHook(() => useSetupComplete(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("writes created family data to the query cache only", async () => {
    const queryClient = new QueryClient();
    vi.spyOn(familyService, "createFamily").mockResolvedValue({
      data: testFamily,
    });

    const { result } = renderHook(() => useCreateFamily(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      name: testFamily.name,
      members: testFamily.members.map(({ name, color }) => ({ name, color })),
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<FamilyApiResponse>(familyKeys.family())?.data,
      ).toEqual(testFamily),
    );
    expect(localStorage.getItem("family-hub-family")).toBeNull();
  });

  it("keeps the optimistic update rollback in TanStack Query", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });
    queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
      data: testFamily,
    });
    vi.spyOn(familyService, "updateFamily").mockRejectedValue(
      new Error("Nope"),
    );

    const { result } = renderHook(() => useUpdateFamily(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ name: "Temporary" });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<FamilyApiResponse>(familyKeys.family())?.data
          ?.name,
      ).toBe("Test Family"),
    );
  });
});
