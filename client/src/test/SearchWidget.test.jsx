import React from "react";
import { render, screen } from "@testing-library/react";
import SearchWidget from "../components/SearchWidget";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";

describe("SearchWidget", () => {
  it("renders correctly", () => {
    render(<SearchWidget />);
    expect(screen.getByPlaceholderText("Type here to Search")).toBeInTheDocument();
  });
});
