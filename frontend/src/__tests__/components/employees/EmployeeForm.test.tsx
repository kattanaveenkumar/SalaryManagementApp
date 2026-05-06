import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeForm from "@/components/employees/EmployeeForm";
import type { Employee } from "@/types";

const employee: Employee = {
  id: 1,
  full_name: "Jane Doe",
  job_title: "Engineer",
  country: "United States",
  salary: 95000,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("EmployeeForm", () => {
  it("shows 'Add Employee' title when no employee is provided", () => {
    render(<EmployeeForm onSubmit={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText("Add Employee")).toBeInTheDocument();
  });

  it("shows 'Edit Employee' title when an employee is provided", () => {
    render(<EmployeeForm employee={employee} onSubmit={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText("Edit Employee")).toBeInTheDocument();
  });

  it("pre-fills form fields when editing", () => {
    render(<EmployeeForm employee={employee} onSubmit={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("United States")).toBeInTheDocument();
    expect(screen.getByDisplayValue("95000")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn();
    render(<EmployeeForm onSubmit={jest.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit and then onClose on successful submission", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<EmployeeForm onSubmit={onSubmit} onClose={onClose} />);

    await userEvent.clear(screen.getByPlaceholderText("Jane Smith"));
    await userEvent.type(screen.getByPlaceholderText("Jane Smith"), "Alice");
    await userEvent.clear(screen.getByPlaceholderText("Software Engineer"));
    await userEvent.type(screen.getByPlaceholderText("Software Engineer"), "Dev");
    await userEvent.clear(screen.getByPlaceholderText("United States"));
    await userEvent.type(screen.getByPlaceholderText("United States"), "Canada");
    await userEvent.clear(screen.getByPlaceholderText("75000"));
    await userEvent.type(screen.getByPlaceholderText("75000"), "70000");

    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("shows error message when onSubmit throws", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Salary is too low"));
    render(<EmployeeForm employee={employee} onSubmit={onSubmit} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() =>
      expect(screen.getByText("Salary is too low")).toBeInTheDocument(),
    );
  });

  it("disables the submit button while submitting", async () => {
    let resolve!: () => void;
    const onSubmit = jest.fn().mockReturnValue(new Promise<void>((r) => (resolve = r)));
    render(<EmployeeForm employee={employee} onSubmit={onSubmit} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /update/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    resolve();
  });
});
