import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { KpiCard } from "@/components/ui/KpiCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Package } from "lucide-react";

// --- KpiCard ---
describe("KpiCard", () => {
  it("renders title and value", () => {
    render(
      <KpiCard
        title="Total SKUs"
        value="42"
        subtitle="Products in inventory"
        icon={<Package data-testid="pkg-icon" size={15} />}
      />
    );
    expect(screen.getByText("Total SKUs")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Products in inventory")).toBeInTheDocument();
  });

  it("renders trend indicator when provided", () => {
    render(
      <KpiCard
        title="Revenue"
        value="₹12,000"
        icon={<span />}
        trend={{ value: "5.2% avg margin", positive: true }}
      />
    );
    expect(screen.getByText(/5.2% avg margin/)).toBeInTheDocument();
  });

  it("applies positive trend color for upward trend", () => {
    const { container } = render(
      <KpiCard
        title="Test"
        value="100"
        icon={<span />}
        trend={{ value: "+10%", positive: true }}
      />
    );
    const trend = container.querySelector("div[style*='color']");
    expect(trend).toBeInTheDocument();
  });
});

// --- LoadingSpinner ---
describe("LoadingSpinner", () => {
  it("renders with correct ARIA label", () => {
    render(<LoadingSpinner message="Loading products..." />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading products...");
    expect(screen.getByText("Loading products...")).toBeInTheDocument();
  });

  it("renders with default aria label when no message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });
});
