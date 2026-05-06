import { formatCurrency } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats a whole dollar amount", () => {
    expect(formatCurrency(75000)).toBe("$75,000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats a large value with commas", () => {
    expect(formatCurrency(500000)).toBe("$500,000");
  });

  it("rounds fractional cents (no decimal in output)", () => {
    const result = formatCurrency(1234.56);
    expect(result).not.toMatch(/\./);
    expect(result).toBe("$1,235");
  });

  it("handles negative values", () => {
    expect(formatCurrency(-1000)).toMatch(/-?\$?1,000|\(\$1,000\)/);
  });
});
