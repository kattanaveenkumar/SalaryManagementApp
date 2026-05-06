import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobTitleInsights from "@/components/insights/JobTitleInsights";
import type { JobTitleSalary } from "@/types";

const data: JobTitleSalary[] = [
  { job_title: "Engineer", country: "United States", employee_count: 5, avg_salary: 90000 },
  { job_title: "Designer", country: "United States", employee_count: 3, avg_salary: 70000 },
  { job_title: "Analyst", country: "Germany", employee_count: 4, avg_salary: 75000 },
];

describe("JobTitleInsights", () => {
  it("renders the heading", () => {
    render(<JobTitleInsights data={data} />);
    expect(screen.getByText(/avg salary by job title/i)).toBeInTheDocument();
  });

  it("renders all rows when no filter is set", () => {
    render(<JobTitleInsights data={data} />);
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
  });

  it("filters rows by country input", async () => {
    render(<JobTitleInsights data={data} />);
    await userEvent.type(screen.getByPlaceholderText(/filter by country/i), "Germany");
    expect(screen.queryByText("Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
  });

  it("filter is case-insensitive", async () => {
    render(<JobTitleInsights data={data} />);
    await userEvent.type(screen.getByPlaceholderText(/filter by country/i), "germany");
    expect(screen.getByText("Analyst")).toBeInTheDocument();
  });

  it("shows formatted avg salary", () => {
    render(<JobTitleInsights data={data} />);
    expect(screen.getByText("$90,000")).toBeInTheDocument();
  });

  it("renders with empty data without crashing", () => {
    render(<JobTitleInsights data={[]} />);
    expect(screen.getByText(/avg salary by job title/i)).toBeInTheDocument();
  });
});
