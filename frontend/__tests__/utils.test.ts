import { formatCurrency, formatNumber, RISK_COLORS, RISK_BADGE_CLASS } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats Indian rupees correctly", () => {
    const result = formatCurrency(1250);
    expect(result).toContain("1,250");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("handles large numbers", () => {
    const result = formatCurrency(100000);
    expect(result).toContain("1,00,000"); // Indian number format
  });
});

describe("formatNumber", () => {
  it("formats with default 1 decimal", () => {
    expect(formatNumber(42.567)).toBe("42.6");
  });

  it("formats with zero decimals", () => {
    expect(formatNumber(42.9, 0)).toBe("43");
  });
});

describe("RISK_COLORS", () => {
  it("has entries for all risk levels", () => {
    expect(RISK_COLORS.critical).toBeDefined();
    expect(RISK_COLORS.high).toBeDefined();
    expect(RISK_COLORS.medium).toBeDefined();
    expect(RISK_COLORS.low).toBeDefined();
  });

  it("critical risk is red", () => {
    expect(RISK_COLORS.critical).toBe("#ef4444");
  });
});

describe("RISK_BADGE_CLASS", () => {
  it("maps risk levels to badge classes", () => {
    expect(RISK_BADGE_CLASS.critical).toContain("badge-red");
    expect(RISK_BADGE_CLASS.high).toContain("badge-amber");
    expect(RISK_BADGE_CLASS.medium).toContain("badge-blue");
    expect(RISK_BADGE_CLASS.low).toContain("badge-green");
  });
});
