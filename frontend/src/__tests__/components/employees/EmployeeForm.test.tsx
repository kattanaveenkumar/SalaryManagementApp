import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeForm from "@/components/employees/EmployeeForm";
import type { Employee } from "@/types";

const employee: Employee = {
  id: 1,
  employee_id: "EMP001",
  first_name: "Jane",
  last_name: "Doe",
  preferred_name: null,
  full_name: "Jane Doe",
  display_name: "Jane Doe",
  initials: "JD",
  work_email: null,
  phone_number: null,
  job_title: "Engineer",
  job_level: null,
  department: null,
  business_unit: null,
  employment_status: "Active",
  employment_type: "Full-Time",
  manager_name: null,
  work_location: null,
  country: "United States",
  salary: 95000,
  currency: "USD",
  salary_band: null,
  bonus_percentage: null,
  stock_grant_value: null,
  hire_date: null,
  compensation_review_date: null,
  notes: null,
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

  it("pre-fills first and last name fields when editing", () => {
    render(<EmployeeForm employee={employee} onSubmit={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
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
    render(<EmployeeForm employee={employee} onSubmit={onSubmit} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("shows error message when onSubmit throws", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Salary is too low"));
    render(<EmployeeForm employee={employee} onSubmit={onSubmit} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText("Salary is too low")).toBeInTheDocument());
  });

  it("disables the submit button while submitting", async () => {
    let resolve!: () => void;
    const onSubmit = jest.fn().mockReturnValue(new Promise<void>((r) => (resolve = r)));
    render(<EmployeeForm employee={employee} onSubmit={onSubmit} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    resolve();
  });
});
