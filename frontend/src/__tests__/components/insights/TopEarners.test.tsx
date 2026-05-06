import { render, screen } from "@testing-library/react";
import TopEarners from "@/components/insights/TopEarners";
import type { TopEarner } from "@/types";

const data: TopEarner[] = [
  { id: 1, full_name: "Alice Smith", job_title: "CTO", country: "US", salary: 300000 },
  { id: 2, full_name: "Bob Jones", job_title: "VP Eng", country: "UK", salary: 250000 },
];

describe("TopEarners", () => {
  it("renders the heading", () => {
    render(<TopEarners data={data} />);
    expect(screen.getByText(/top 10 earners/i)).toBeInTheDocument();
  });

  it("renders all earners", () => {
    render(<TopEarners data={data} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows rank numbers", () => {
    render(<TopEarners data={data} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("formats salaries as currency", () => {
    render(<TopEarners data={data} />);
    expect(screen.getByText("$300,000")).toBeInTheDocument();
    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });

  it("displays job title and country", () => {
    render(<TopEarners data={data} />);
    expect(screen.getByText(/CTO.*US/)).toBeInTheDocument();
  });

  it("renders with empty data without crashing", () => {
    render(<TopEarners data={[]} />);
    expect(screen.getByText(/top 10 earners/i)).toBeInTheDocument();
  });
});
