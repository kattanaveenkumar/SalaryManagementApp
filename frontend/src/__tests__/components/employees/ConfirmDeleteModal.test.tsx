import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDeleteModal from "@/components/employees/ConfirmDeleteModal";
import type { Employee } from "@/types";

const employee: Employee = {
  id: 1,
  full_name: "Jane Doe",
  job_title: "Engineer",
  country: "US",
  salary: 80000,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("ConfirmDeleteModal", () => {
  it("shows the employee name", () => {
    render(<ConfirmDeleteModal employee={employee} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText(/jane doe/i)).toBeInTheDocument();
  });

  it("calls onConfirm when Delete button is clicked", async () => {
    const onConfirm = jest.fn();
    render(<ConfirmDeleteModal employee={employee} onConfirm={onConfirm} onCancel={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = jest.fn();
    render(<ConfirmDeleteModal employee={employee} onConfirm={jest.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders a warning about irreversibility", () => {
    render(<ConfirmDeleteModal employee={employee} onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });
});
