import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { GameScreenshotsCarousel } from "../GameScreenshotsCarousel";
import { I18nProvider } from "../../../i18n";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke, convertFileSrc: (path: string) => `https://local.test${path}` }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn().mockResolvedValue(null) }));

beforeEach(() => {
  invoke.mockImplementation(async (command: string) => {
    if (command === "get_game_by_id") return { igdb_id: 1942 };
    if (command === "get_igdb_screenshots") return ["https://example.test/one.jpg", "https://example.test/two.jpg"];
    if (command === "get_screenshots") return [{ id: 3, game_id: 7, file_path: "/three.jpg", is_cover: false, created_at: "2026-01-01" }];
    return true;
  });
});
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });

describe("GameScreenshotsCarousel accessibility", () => {
  it("navigates with native keyboard controls, announces selection and avoids form submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<I18nProvider><form onSubmit={onSubmit}><GameScreenshotsCarousel gameId={7} /></form></I18nProvider>);
    const next = await screen.findByRole("button", { name: "Next screenshot" });
    const first = screen.getByRole("button", { name: "View screenshot 1" });
    const second = screen.getByRole("button", { name: "View screenshot 2" });
    expect(first).toHaveAttribute("aria-pressed", "true");
    next.focus();
    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
    const previous = screen.getByRole("button", { name: "Previous screenshot" });
    previous.focus();
    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-pressed", "true");
    const third = screen.getByRole("button", { name: "View screenshot 3" });
    await user.click(third);
    expect(third).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Delete local screenshot" })).toBeInTheDocument();
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAttribute("type", "button");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("localizes the new control labels in French", async () => {
    localStorage.setItem("pascal-language", "fr");
    render(<I18nProvider><GameScreenshotsCarousel gameId={7} /></I18nProvider>);
    expect(await screen.findByRole("button", { name: "Capture suivante" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Capture précédente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Afficher la capture 1" })).toHaveAttribute("aria-pressed", "true");
  });
});
