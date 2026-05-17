import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/stores";
import { render, renderWithUser, screen } from "@/test/test-utils";
import { MobileBottomNav } from "./mobile-bottom-nav";

describe("MobileBottomNav", () => {
  beforeEach(() => {
    useAppStore.setState({ activeModule: "calendar", isSidebarOpen: false });
  });

  it("renders the primary tabs and marks School active by default", () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: /primary/i });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^school$/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: /^rewards$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^tasks$/i }),
    ).toBeInTheDocument();
  });

  it("switches modules through the app store", async () => {
    const { user } = renderWithUser(<MobileBottomNav />);

    await user.click(screen.getByRole("button", { name: /^rewards$/i }));
    expect(useAppStore.getState().activeModule).toBe("lists");

    await user.click(screen.getByRole("button", { name: /^tasks$/i }));
    expect(useAppStore.getState().activeModule).toBe("chores");
  });
});
