import React from "react";
import { render, screen } from "@testing-library/react";
import SearchWidget from "./SearchWidget.jsx";
import { describe, it, expect } from "vitest";

describe("SearchWidget", () => {
  it("renders correctly", () => {
    render(<SearchWidget />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });
});
