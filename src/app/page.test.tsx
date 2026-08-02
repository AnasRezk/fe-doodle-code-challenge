import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("shows that the application is ready", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Doodle Chat" })).toBeVisible();
  });
});
