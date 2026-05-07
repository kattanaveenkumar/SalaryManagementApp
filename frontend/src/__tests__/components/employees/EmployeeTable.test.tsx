import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeTable from "@/components/employees/EmployeeTable";
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

describe("EmployeeTable", () => {
  it("shows empty state when no employees", () => {
    render(<EmployeeTable employees={[]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText(/no employees found/i)).toBeInTheDocument();
  });

  it("renders employee rows", () => {
    render(<EmployeeTable employees={[employee]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("$95,000")).toBeInTheDocument();
  });

  it("calls onEdit with the employee when Edit is clicked", async () => {
    const onEdit = jest.fn();
    render(<EmployeeTable employees={[employee]} onEdit={onEdit} onDelete={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /employee actions/i }));
    await userEvent.click(screen.getByText("Edit employee"));
    expect(onEdit).toHaveBeenCalledWith(employee);
  });

  it("calls onDelete with the employee when Delete is clicked", async () => {
    const onDelete = jest.fn();
    render(<EmployeeTable employees={[employee]} onEdit={jest.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /employee actions/i }));
    await userEvent.click(screen.getByText("Remove"));
    expect(onDelete).toHaveBeenCalledWith(employee);
  });

  it("renders multiple employees", () => {
    const second: Employee = {
      ...employee,
      id: 2,
      full_name: "Bob Smith",
      display_name: "Bob Smith",
    };
    render(
      <EmployeeTable employees={[employee, second]} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });
});
