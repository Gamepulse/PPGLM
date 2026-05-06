import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import GameCard from "../components/Library/GameCard";
import { I18nProvider } from "../i18n/I18nContext";
import { Game } from "../types";
import "@testing-library/jest-dom";

const mockGame: Game = {
  id: 1,
  display_name: "Test Game",
  folder_path: "/test/path",
  added_date: "2023-01-01",
  created_at: "2023-01-01",
  is_favorite: false,
  tags: [
    { id: 1, name: "Action", category: "Genre" }
  ],
  completion_status: "playing",
  personal_rating: 85,
  igdb_id: 123,
  cover_url: "http://example.com/cover.jpg",
  genres: [{ id: 1, name: "Adventure" }]
};

test("GameCard renders buttons for tags and status", () => {
  render(
    <I18nProvider>
      <GameCard
        game={mockGame}
        onClick={() => {}}
        viewMode="grid"
        onFilter={() => {}}
      />
    </I18nProvider>
  );

  // Check for status button
  const statusButton = screen.getByLabelText(/Status: Playing/i);
  expect(statusButton).toBeInTheDocument();
  expect(statusButton.tagName).toBe("BUTTON");

  // Check for tag button
  const tagButton = screen.getByLabelText(/Filter by tag: Action/i);
  expect(tagButton).toBeInTheDocument();
  expect(tagButton.tagName).toBe("BUTTON");

  // Check for metadata button
  const genreButton = screen.getByLabelText(/genre: Adventure/i);
  expect(genreButton).toBeInTheDocument();
  expect(genreButton.tagName).toBe("BUTTON");
});

test("GameCard renders quick assign button with aria-label", () => {
  render(
    <I18nProvider>
      <GameCard
        game={mockGame}
        onClick={() => {}}
        viewMode="grid"
        showQuickAssign={true}
      />
    </I18nProvider>
  );

  const quickAssignButton = screen.getByLabelText(/Select platform/i);
  expect(quickAssignButton).toBeInTheDocument();
  expect(quickAssignButton.tagName).toBe("BUTTON");
});
