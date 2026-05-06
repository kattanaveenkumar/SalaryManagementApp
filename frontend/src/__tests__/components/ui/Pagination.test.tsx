import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/components/ui/Pagination";

const baseMeta = { total_count: 100, total_pages: 4, current_page: 2, per_page: 25 };

describe("Pagination", () => {
  it("displays the current page range", () => {
    render(<Pagination meta={baseMeta} onPageChange={jest.fn()} />);
    expect(screen.getByText(/26.+50/)).toBeInTheDocument();
  });

  it("displays total count", () => {
    render(<Pagination meta={baseMeta} onPageChange={jest.fn()} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("calls onPageChange with the previous page when Previous is clicked", async () => {
    const onPageChange = jest.fn();
    render(<Pagination meta={baseMeta} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with the next page when Next is clicked", async () => {
    const onPageChange = jest.fn();
    render(<Pagination meta={baseMeta} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables Previous button on first page", () => {
    const meta = { ...baseMeta, current_page: 1 };
    render(<Pagination meta={meta} onPageChange={jest.fn()} />);
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("disables Next button on last page", () => {
    const meta = { ...baseMeta, current_page: 4 };
    render(<Pagination meta={meta} onPageChange={jest.fn()} />);
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("shows page X of Y", () => {
    render(<Pagination meta={baseMeta} onPageChange={jest.fn()} />);
    expect(screen.getByText(/Page 2 of 4/)).toBeInTheDocument();
  });
});
