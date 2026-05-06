import { render, screen } from "@testing-library/react";
import PercentileTable from "@/components/insights/PercentileTable";
import type { SalaryPercentile } from "@/types";

const data: SalaryPercentile[] = [
  { country: "United States", p25: 60000, p50: 80000, p75: 100000, p90: 120000 },
  { country: "Germany", p25: 50000, p50: 70000, p75: 90000, p90: 110000 },
];

describe("PercentileTable", () => {
  it("renders the heading", () => {
    render(<PercentileTable data={data} />);
    expect(screen.getByText(/salary percentiles by country/i)).toBeInTheDocument();
  });

  it("renders a row for each country", () => {
    render(<PercentileTable data={data} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
  });

  it("shows P25, P50, P75, P90 column headers", () => {
    render(<PercentileTable data={data} />);
    expect(screen.getByText("P25")).toBeInTheDocument();
    expect(screen.getByText(/Median/i)).toBeInTheDocument();
    expect(screen.getByText("P75")).toBeInTheDocument();
    expect(screen.getByText("P90")).toBeInTheDocument();
  });

  it("formats percentile values as currency", () => {
    render(<PercentileTable data={data} />);
    expect(screen.getByText("$60,000")).toBeInTheDocument();
    expect(screen.getByText("$80,000")).toBeInTheDocument();
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$120,000")).toBeInTheDocument();
  });

  it("renders with empty data without crashing", () => {
    render(<PercentileTable data={[]} />);
    expect(screen.getByText(/salary percentiles by country/i)).toBeInTheDocument();
  });
});
