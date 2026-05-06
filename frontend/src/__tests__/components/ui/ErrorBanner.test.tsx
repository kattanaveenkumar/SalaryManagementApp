import { render, screen } from "@testing-library/react";
import ErrorBanner from "@/components/ui/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders the message", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has role=alert for accessibility", () => {
    render(<ErrorBanner message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
