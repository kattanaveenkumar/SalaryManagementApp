import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeFilters from "@/components/employees/EmployeeFilters";

describe("EmployeeFilters", () => {
  it("renders country and job title inputs", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText(/united states/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/software engineer/i)).toBeInTheDocument();
  });

  it("renders the Apply button", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  it("does not show Clear button when no active filters", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("shows Clear button when active filters exist", () => {
    render(<EmployeeFilters filters={{ country: "Germany" }} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("calls onChange with typed country when Apply is clicked", async () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{}} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText(/united states/i), "Canada");
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ country: "Canada" }));
  });

  it("calls onChange with undefined values when Clear is clicked", async () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{ country: "Germany" }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({ country: undefined, job_title: undefined });
  });

  it("triggers Apply on Enter key in country input", async () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{}} onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText(/united states/i), "France{Enter}");
    expect(onChange).toHaveBeenCalled();
  });
});
