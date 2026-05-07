import { render, screen } from "@testing-library/react";
import CountrySalaryTable from "@/components/insights/CountrySalaryTable";
import type { CountrySalary } from "@/types";

const data: CountrySalary[] = [
  {
    country: "Germany",
    employee_count: 10,
    min_salary: 50000,
    max_salary: 120000,
    avg_salary: 80000,
  },
  {
    country: "United States",
    employee_count: 25,
    min_salary: 60000,
    max_salary: 200000,
    avg_salary: 110000,
  },
];

describe("CountrySalaryTable", () => {
  it("renders the heading", () => {
    render(<CountrySalaryTable data={data} />);
    expect(screen.getByText(/salary by country/i)).toBeInTheDocument();
  });

  it("renders a row for each country", () => {
    render(<CountrySalaryTable data={data} />);
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("displays formatted salary values", () => {
    render(<CountrySalaryTable data={data} />);
    expect(screen.getByText("$80,000")).toBeInTheDocument();
    expect(screen.getByText("$110,000")).toBeInTheDocument();
  });

  it("displays employee counts", () => {
    render(<CountrySalaryTable data={data} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders with empty data without crashing", () => {
    render(<CountrySalaryTable data={[]} />);
    expect(screen.getByText(/salary by country/i)).toBeInTheDocument();
  });
});
