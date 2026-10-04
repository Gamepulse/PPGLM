import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { GameDetailHeader } from "../GameDetailHeader";
import { I18nProvider } from "../../../i18n";
import { gameFixture } from "./gameFixture";

vi.mock("../GameNameEditor", () => ({ GameNameEditor: () => null }));
vi.mock("../TagEditor", () => ({ TagEditor: () => null }));
vi.mock("../../../context/SettingsContext", async importOriginal => ({
  ...await importOriginal<typeof import("../../../context/SettingsContext")>(),
  useSettings: () => ({ activeConsoles: ["pc", "ps5"] }),
}));

afterEach(() => { cleanup(); localStorage.clear(); });

describe("GameDetailHeader controls", () => {
  it.each([0, 85])("can clear a set rating of %s with one activation", async rating => {
    const user = userEvent.setup();
    const onRatingChange = vi.fn();
    render(<I18nProvider><GameDetailHeader game={{ ...gameFixture, personal_rating: rating }} onRatingChange={onRatingChange} /></I18nProvider>);
    const clear = screen.getByRole("button", { name: "Clear Rating" });
    for (const key of [null, "{Enter}", " "]) {
      onRatingChange.mockClear();
      if (key === null) await user.click(clear);
      else { clear.focus(); await user.keyboard(key); }
      expect(onRatingChange).toHaveBeenCalledExactlyOnceWith(null);
    }
  });

  it("does not show reset or enable the slider without a rating callback", () => {
    render(<I18nProvider><GameDetailHeader game={gameFixture} /></I18nProvider>);
    expect(screen.queryByRole("button", { name: "Clear Rating" })).not.toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Personal Rating/ })).toBeDisabled();
  });

  it("does not show reset for an unset rating and preserves the existing slider scale", () => {
    const onRatingChange = vi.fn();
    render(<I18nProvider><GameDetailHeader game={{ ...gameFixture, personal_rating: null }} onRatingChange={onRatingChange} /></I18nProvider>);
    expect(screen.queryByRole("button", { name: "Clear Rating" })).not.toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: /Personal Rating/ });
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "100");
    fireEvent.change(slider, { target: { value: "42" } });
    expect(onRatingChange).toHaveBeenCalledExactlyOnceWith(42);
  });

  it("exposes a favorite toggle's state and associates platform/rating labels uniquely", async () => {
    const user = userEvent.setup();
    const onFavoriteToggle = vi.fn();
    const onPlatformChange = vi.fn();
    render(<I18nProvider>
      <GameDetailHeader game={gameFixture} onFavoriteToggle={onFavoriteToggle} onPlatformChange={onPlatformChange} onRatingChange={vi.fn()} />
      <GameDetailHeader game={{ ...gameFixture, id: 8, is_favorite: false }} onFavoriteToggle={vi.fn()} onPlatformChange={vi.fn()} onRatingChange={vi.fn()} />
    </I18nProvider>);
    const favorite = screen.getByRole("button", { name: "Remove from Favorites" });
    expect(favorite).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Add to Favorites" })).toHaveAttribute("aria-pressed", "false");
    await user.click(favorite);
    expect(onFavoriteToggle).toHaveBeenCalledExactlyOnceWith();
    const selectors = screen.getAllByRole("combobox", { name: "Platforms" });
    expect(selectors[0].id).not.toBe(selectors[1].id);
    expect(screen.getAllByRole("slider")[0].id).not.toBe(screen.getAllByRole("slider")[1].id);
    await user.selectOptions(selectors[0], "pc");
    expect(onPlatformChange).toHaveBeenCalledExactlyOnceWith("pc");
  });

  it("makes metadata buttons actionable only with a callback and never submits a form", async () => {
    const user = userEvent.setup();
    const onFilter = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { rerender } = render(<I18nProvider><form onSubmit={onSubmit}><GameDetailHeader game={gameFixture} onFilter={onFilter} /></form></I18nProvider>);
    for (const [name, type, value] of [
      ["Genres: RPG", "genre", "RPG"], ["Game Modes: Single player", "mode", "Single player"],
      ["Perspective: Third person", "perspective", "Third person"], ["Themes: Fantasy", "theme", "Fantasy"],
    ]) {
      onFilter.mockClear();
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("type", "button");
      button.focus();
      await user.keyboard("{Enter}");
      expect(onFilter).toHaveBeenCalledExactlyOnceWith(type, value);
    }
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<I18nProvider><GameDetailHeader game={gameFixture} /></I18nProvider>);
    for (const value of ["RPG", "Single player", "Third person", "Fantasy"]) {
      expect(screen.getByText(value).tagName).toBe("SPAN");
    }
  });
});
