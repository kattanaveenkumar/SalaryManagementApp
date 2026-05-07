import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeFilters from "@/components/employees/EmployeeFilters";

describe("EmployeeFilters", () => {
  it("renders name search and country filter inputs", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText(/search employees/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Country")).toBeInTheDocument();
  });

  it("renders salary range inputs", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText("Min $")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max $")).toBeInTheDocument();
  });

  it("does not show Clear button when no active filters", () => {
    render(<EmployeeFilters filters={{}} onChange={jest.fn()} />);
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("shows Clear button when active filters exist", () => {
    render(<EmployeeFilters filters={{ country: "Germany" }} onChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("calls onChange immediately when country is typed", () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{}} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Country"), { target: { value: "Canada" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ country: "Canada" }));
  });

  it("calls onChange with undefined values when Clear is clicked", async () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{ country: "Germany" }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({ country: undefined, job_title: undefined });
  });

  it("calls onChange when salary minimum is set", () => {
    const onChange = jest.fn();
    render(<EmployeeFilters filters={{}} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Min $"), { target: { value: "50000" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ salary_min: 50000 }));
  });
});
