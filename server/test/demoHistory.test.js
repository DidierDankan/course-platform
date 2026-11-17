// The demo seed's sales plan (scripts/demoHistory.js): what the seller dashboard shows on the live demo.
import { describe, expect, it } from "vitest";
import { statsWindow } from "../db/SellerStatsService.js";
import { DEMO_LEARNERS, reviewPlan, salesHistory } from "../scripts/demoHistory.js";

const monthOf = (date) => date.toISOString().slice(0, 7);

describe.each([
  ["mid-month", new Date(Date.UTC(2026, 10, 14, 12, 0))],
  ["first hour of the year", new Date(Date.UTC(2027, 0, 1, 0, 30))],
  ["end of February", new Date(Date.UTC(2028, 1, 29, 23, 59))],
])("sales plan (%s)", (_, now) => {
  const sales = salesHistory(now);
  const { months } = statsWindow(now);

  it("every sale is inside the dashboard's 12 months, and none is in the future", () => {
    for (const sale of sales) {
      expect(months).toContain(monthOf(sale.at));
      expect(sale.at.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it("each learner buys a course at most once (enrollments and payments are unique per pair)", () => {
    const pairs = sales.map((s) => `${s.learner}:${s.course}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(sales.every((s) => s.learner >= 0 && s.learner < DEMO_LEARNERS)).toBe(true);
  });

  it("every month has sales, and the newest quarter has more than the oldest", () => {
    const perMonth = months.map((m) => sales.filter((s) => monthOf(s.at) === m).length);
    expect(perMonth.every((n) => n > 0)).toBe(true);
    expect(perMonth.slice(-3).reduce((a, b) => a + b)).toBeGreaterThan(perMonth.slice(0, 3).reduce((a, b) => a + b));
  });

  it("is the same every run", () => {
    expect(salesHistory(now)).toEqual(sales);
  });

  it("reviews: only by a buyer of that course, rating 1-5, once per pair, never in the future", () => {
    const reviews = reviewPlan(sales, now);
    const bought = new Set(sales.map((s) => `${s.learner}:${s.course}`));
    expect(reviews.length).toBeGreaterThan(0);
    for (const r of reviews) {
      expect(bought.has(`${r.learner}:${r.course}`)).toBe(true);
      expect(Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5).toBe(true);
      expect(r.at.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(r.body === null || r.body.length <= 1000).toBe(true);
    }
    expect(new Set(reviews.map((r) => `${r.learner}:${r.course}`)).size).toBe(reviews.length);
  });
});
