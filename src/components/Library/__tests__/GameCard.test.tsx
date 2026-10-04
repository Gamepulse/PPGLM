import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import GameCard from "../GameCard";
import { I18nProvider } from "../../../i18n";
import { gameFixture } from "./gameFixture";

afterEach(() => { cleanup(); localStorage.clear(); });

describe.each(["grid", "list", "compact"] as const)("GameCard %s", viewMode => {
  it("opens exactly once for the cover, card background, title click, Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(<I18nProvider><GameCard game={gameFixture} viewMode={viewMode} onClick={onClick} /></I18nProvider>);
    const title = screen.getByRole("button", { name: "Open game details: The Witcher 3" });
    const actions = [
      () => user.click(screen.getByRole("img", { name: "The Witcher 3" })),
      () => user.click(container.firstElementChild!),
      () => user.click(title),
      async () => { title.focus(); await user.keyboard("{Enter}"); },
      async () => { title.focus(); await user.keyboard(" "); },
    ];
    for (const action of actions) {
      onClick.mockClear();
      await action();
      expect(onClick).toHaveBeenCalledExactlyOnceWith(gameFixture.id);
    }
    expect(container.firstElementChild).not.toHaveAttribute("role", "button");
    expect(container.firstElementChild).not.toHaveAttribute("tabindex");
  });

  it("keeps every available filter independent for mouse, Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onFilter = vi.fn();
    render(<I18nProvider><GameCard game={gameFixture} viewMode={viewMode} onClick={onClick} onFilter={onFilter} /></I18nProvider>);
    const filters = viewMode === "compact" ? [] : [
      ["Filter by tag: Backlog", "tag", "Backlog"],
      ["Genres: RPG", "genre", "RPG"],
      ["Game Modes: Single player", "mode", "Single player"],
      ["Perspective: Third person", "perspective", "Third person"],
      ["Themes: Fantasy", "theme", "Fantasy"],
    ];
    if (viewMode !== "list") filters.push(["Status: Playing", "status", "playing"]);
    for (const [name, type, value] of filters) {
      const button = screen.getByRole("button", { name });
      for (const key of [null, "{Enter}", " "]) {
        onFilter.mockClear();
        if (key === null) await user.click(button);
        else { button.focus(); await user.keyboard(key); }
        expect(onFilter).toHaveBeenCalledExactlyOnceWith(type, value);
        expect(onClick).not.toHaveBeenCalled();
      }
    }
  });

  it("exposes static metadata, not dead controls, without filter/assign callbacks", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<I18nProvider><GameCard game={gameFixture} viewMode={viewMode} onClick={onClick} showQuickAssign /></I18nProvider>);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    await user.tab();
    expect(buttons[0]).toHaveFocus();
    const metadata = screen.getByText(viewMode === "compact" ? "Playing" : "Backlog");
    expect(metadata.tagName).toBe("SPAN");
    expect(metadata).not.toHaveAttribute("tabindex");
    await user.click(metadata);
    expect(onClick).toHaveBeenCalledExactlyOnceWith(gameFixture.id);
  });

  it("keeps quick assign separate and has no nested or submit buttons", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onQuickAssign = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = render(<I18nProvider><form onSubmit={onSubmit}><GameCard game={gameFixture} viewMode={viewMode} onClick={onClick} onFilter={vi.fn()} showQuickAssign onQuickAssign={onQuickAssign} /></form></I18nProvider>);
    const button = screen.getByRole("button", { name: "Quick assign platform" });
    for (const key of [null, "{Enter}", " "]) {
      onQuickAssign.mockClear();
      if (key === null) await user.click(button);
      else { button.focus(); await user.keyboard(key); }
      expect(onQuickAssign).toHaveBeenCalledExactlyOnceWith();
    }
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector("button button, [role=button] button, button [role=button]")).toBeNull();
    for (const control of screen.getAllByRole("button")) expect(control).toHaveAttribute("type", "button");
  });

  it("announces the full platform and favorite state", () => {
    render(<I18nProvider><GameCard game={gameFixture} viewMode={viewMode} onClick={vi.fn()} /></I18nProvider>);
    expect(screen.getByRole("img", { name: "Platforms: PlayStation 5" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Favorite" })).toBeInTheDocument();
  });
});

it.each([["playstation", "PlayStation"], ["pc", "PC"], ["custom-console", "custom-console"]])("preserves the accessible platform for %s", (platform, label) => {
  render(<I18nProvider><GameCard game={{ ...gameFixture, platform }} viewMode="grid" onClick={vi.fn()} /></I18nProvider>);
  expect(screen.getByRole("img", { name: `Platforms: ${label}` })).toBeInTheDocument();
});

it("localizes the independent controls in French", () => {
  localStorage.setItem("pascal-language", "fr");
  render(<I18nProvider><GameCard game={gameFixture} viewMode="grid" onClick={vi.fn()} onFilter={vi.fn()} showQuickAssign onQuickAssign={vi.fn()} /></I18nProvider>);
  expect(screen.getByRole("button", { name: "Ouvrir la fiche du jeu: The Witcher 3" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Assigner rapidement une plateforme" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Filtrer par tag: Backlog" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Plateformes: PlayStation 5" })).toBeInTheDocument();
});
