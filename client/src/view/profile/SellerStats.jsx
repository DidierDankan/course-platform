import { DollarSign, Users } from "lucide-react";
import MonthlyChart from "@components/ui/charts/MonthlyChart";
import RankedBars from "@components/ui/charts/RankedBars";
import StatCard from "@components/ui/StatCard";
import { useGetSellerStatsQuery } from "@api/modules/dashboardApi";
import { CURRENCY, formatPrice } from "@utils/currency";

const students = (n) => `${n.toLocaleString("en-US")} ${n === 1 ? "student" : "students"}`;
// Whole units of the app currency on the axis (ticks are round numbers), cents everywhere a real amount is shown.
const wholeDollars = new Intl.NumberFormat(CURRENCY.locale, { style: "currency", currency: CURRENCY.code, maximumFractionDigits: 0 });

// The seller's own numbers, last 12 months: students (free + paid) and revenue per month, and the courses with the
// most students. The server only ever answers with the signed-in seller's data.
export default function SellerStats() {
  const { data, isLoading, isError, refetch, isFetching } = useGetSellerStatsQuery();

  if (isLoading) {
    return (
      <section className="seller-stats" aria-labelledby="seller-stats-title" aria-busy="true">
        <h2 id="seller-stats-title">Your numbers</h2>
        <div className="page-inline-loader" role="status" aria-label="Loading your numbers">
          <span className="spinner" aria-hidden="true" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="seller-stats" aria-labelledby="seller-stats-title">
        <h2 id="seller-stats-title">Your numbers</h2>
        <div className="panel" role="alert">
          <p>Couldn&apos;t load your numbers right now.</p>
          <button type="button" className="button button-secondary button-small" onClick={refetch} disabled={isFetching}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  const { months, topCourses, totals } = data;
  const studentSeries = months.map((m) => ({ month: m.month, value: m.students }));
  const revenueSeries = months.map((m) => ({ month: m.month, value: m.revenue }));

  return (
    <section className="seller-stats" aria-labelledby="seller-stats-title">
      <div className="profile-section-head">
        <h2 id="seller-stats-title">Your numbers</h2>
        <span className="stat-label">Last 12 months</span>
      </div>

      <div className="stat-grid">
        <StatCard icon={Users} label="New students" value={totals.students.toLocaleString("en-US")} />
        <StatCard icon={DollarSign} label="Revenue" value={formatPrice(totals.revenue)} />
      </div>

      {totals.students === 0 ? (
        <div className="panel">
          <p>No new students in the last 12 months yet. Once people enroll in your courses, their numbers show up here.</p>
        </div>
      ) : (
        <>
          <div className="chart-pair">
            <div className="panel chart-panel">
              <h3>Students per month</h3>
              <p>New enrollments in your courses, free and paid.</p>
              <MonthlyChart
                label="New students per month, last 12 months"
                valueHeader="Students"
                data={studentSeries}
                kind="columns"
                formatValue={students}
              />
            </div>
            <div className="panel chart-panel">
              <h3>Revenue per month</h3>
              <p>Paid purchases, before Stripe fees.</p>
              <MonthlyChart
                label="Revenue per month, last 12 months"
                valueHeader="Revenue"
                data={revenueSeries}
                kind="line"
                formatValue={formatPrice}
                formatTick={(value) => wholeDollars.format(value)}
              />
            </div>
          </div>

          <div className="panel chart-panel">
            <h3>Top courses</h3>
            <p>Your courses with the most new students. A popular free course shows what people are looking for.</p>
            <RankedBars
              label="Your top courses by new students, last 12 months"
              items={topCourses.map((course) => ({ ...course, value: course.students }))}
              formatValue={students}
              formatDetail={(course) => (course.revenue > 0 ? `${formatPrice(course.revenue)} revenue` : "No revenue yet")}
              hrefFor={(course) => `/courses/${course.id}`}
            />
          </div>
        </>
      )}
    </section>
  );
}
