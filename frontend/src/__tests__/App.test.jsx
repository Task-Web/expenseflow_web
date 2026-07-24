import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/expenseflow/");
  });

  it("renders the ExpenseFlow launcher without a generic state editor", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "ExpenseFlow Reports" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open ExpenseFlow" })).toHaveAttribute(
      "href",
      "/expenseflow/index.html"
    );
    expect(screen.queryByRole("textbox", { name: /json payload/i })).not.toBeInTheDocument();
  });
});
