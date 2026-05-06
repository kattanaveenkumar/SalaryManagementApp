import { render, screen } from "@testing-library/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with a loading status role", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has an accessible label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});
