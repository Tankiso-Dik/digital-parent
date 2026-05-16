import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/stores";
import { render, renderWithUser, screen } from "@/test/test-utils";
import { MobileBottomNav } from "./mobile-bottom-nav";

describe("MobileBottomNav", () => {
  beforeEach(() => {
    useAppStore.setState({ activeModule: "habits", isSidebarOpen: false });
  });

  it("renders all six tabs and marks Habits active by default", () => {
    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: /primary/i });

    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^habits$/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: /^school$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^rewards$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^tasks$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^care$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^memories$/i }),
    ).toBeInTheDocument();
  });

  it("switches modules through the app store", async () => {
    const { user } = renderWithUser(<MobileBottomNav />);

    await user.click(screen.getByRole("button", { name: /^memories$/i }));
    expect(useAppStore.getState().activeModule).toBe("photos");

    await user.click(screen.getByRole("button", { name: /^habits$/i }));
    expect(useAppStore.getState().activeModule).toBe("habits");
  });
});
