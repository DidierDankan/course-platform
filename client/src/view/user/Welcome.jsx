import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BookOpen, Trophy, Heart } from "lucide-react";
import { useGetMyDashboardQuery } from "@api/modules/dashboardApi"; // keep your alias
import StatCard from "@components/ui/StatCard";
import UserCourseCard from "@components/ui/UserCourseCard";

export default function UserDashboard() {
  const { profile, isLoading: profileLoading } = useSelector((s) => s.user || {});
  const { data, isLoading, isError, error, refetch } = useGetMyDashboardQuery();

  const name =
    profile?.full_name ||
    profile?.first_name ||
    profile?.firstname ||
    profile?.name ||
    profile?.username ||
    "Student";

  // Skeleton loader that matches your Welcome page vibe
  if (profileLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="animate-pulse space-y-4 mt-8 max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mt-[22px]">
            <div className="h-[86px] bg-gray-200 rounded-[16px]" />
            <div className="h-[86px] bg-gray-200 rounded-[16px]" />
          </div>
          <div className="h-[110px] bg-gray-200 rounded-[16px]" />
          <div className="h-[220px] bg-gray-200 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="text-[18px] font-bold text-[#1e293b]">
              Couldn’t load dashboard
            </div>
            <div className="mt-[6px] text-[14px] text-[#475569]">
              {error?.data?.message || error?.error || "Unknown error"}
            </div>

            <button
              onClick={refetch}
              className="mt-[14px] inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stats = data?.stats || { enrolled: 0, completed: 0 };
  const continueLearning = data?.continueLearning || null;
  const myCourses = Array.isArray(data?.myCourses) ? data.myCourses : [];
  const favorites = Array.isArray(data?.favorites) ? data.favorites : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
        {/* Badge + Heading (same style as Welcome) */}
        <div className="text-center mb-[26px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Student dashboard</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.2] text-[#1e293b]">
            Welcome back, {name}
          </h1>
          <p className="mt-[4px] text-[#475569] text-[15px]">
            Your learning progress and shortcuts.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
          <StatCard icon={BookOpen} label="Enrolled courses" value={stats.enrolled ?? 0} />
          <StatCard icon={Trophy} label="Completed courses" value={stats.completed ?? 0} />
        </div>

        {/* Continue learning */}
        <section className="mt-[26px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1e293b]">
              Continue learning
            </h2>
            {continueLearning?.course_id && (
              <Link
                to={`/courses/${continueLearning.course_id}/watch`}
                className="text-[14px] text-[#4f46e5] font-medium hover:underline"
              >
                Open
              </Link>
            )}
          </div>

          {continueLearning ? (
            <UserCourseCard
              course={continueLearning}
              variant="continue"
              actionLabel="Continue"
              actionTo={`/courses/${continueLearning.course_id}/watch`}
            />
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
              <div className="text-[14px] text-[#475569]">
                You don’t have any enrolled courses yet. Browse courses and enroll to start learning.
              </div>
              <div className="mt-[12px]">
                <Link
                  to="/courses"
                  className="inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
                >
                  Browse courses
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* My courses preview */}
        <section className="mt-[30px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1e293b]">
              My courses
            </h2>
            <Link
              to="/user/courses"
              className="text-[14px] text-[#4f46e5] font-medium hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
            {myCourses.length ? (
              myCourses.map((c) => (
                <UserCourseCard
                  key={c.course_id}
                  course={c}
                  actionLabel="Continue"
                  actionTo={`/courses/${c.course_id}/watch`}
                />
              ))
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] md:col-span-2 text-[14px] text-[#475569]">
                No courses yet.
              </div>
            )}
          </div>
        </section>

        {/* Favorites preview */}
        <section className="mt-[30px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1e293b] flex items-center gap-[8px]">
              <Heart size={18} className="text-[#ef4444]" />
              Favorites
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
            {favorites.length ? (
              favorites.map((f) => (
                <UserCourseCard
                  key={f.course_id}
                  course={f}
                  actionLabel="View"
                  actionTo={`/courses/${f.course_id}`}
                />
              ))
            ) : (
              <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] md:col-span-2 text-[14px] text-[#475569]">
                No favorites yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}