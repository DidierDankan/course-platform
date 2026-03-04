import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BookOpen, Search, ArrowRight, Clock } from "lucide-react";
import { useGetMyEnrollmentsQuery } from "@api/modules/enrollmentApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const clampPct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

const formatDuration = (seconds) => {
  const s = Number(seconds) || 0;
  const mins = Math.floor(s / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

function MyCourseCard({ item }) {
  const pct = clampPct(item.progress);

  const thumb = item.thumbnail_url
    ? `${API_BASE_URL}${item.thumbnail_url}`
    : "https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr]">
        <div className="h-[140px] sm:h-full bg-[#f1f5f9]">
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="p-[16px] flex flex-col gap-[10px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-[#0f172a] truncate">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-[13px] text-[#475569] line-clamp-2 mt-[4px]">
                  {item.description}
                </p>
              ) : null}
            </div>

            <Link
              to={`/courses/${item.course_id}/watch`}
              className="shrink-0 inline-flex items-center gap-[6px] rounded-[12px] bg-[#4f46e5] px-[12px] py-[9px] text-[13px] font-semibold text-white hover:opacity-95"
            >
              Continue <ArrowRight size={16} />
            </Link>
          </div>

          {/* Progress */}
          <div className="mt-[2px]">
            <div className="flex items-center justify-between text-[12px] text-[#475569]">
              <span>Progress</span>
              <span className="font-semibold text-[#0f172a]">{pct}%</span>
            </div>
            <div className="mt-[6px] h-[8px] w-full rounded-full bg-[#e2e8f0] overflow-hidden">
              <div
                className="h-full bg-[#4f46e5]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Small meta row */}
          <div className="flex items-center justify-between pt-[6px] text-[12px] text-[#64748b]">
            <div className="inline-flex items-center gap-[6px]">
              <Clock size={14} />
              <span>
                Last update:{" "}
                {item.updated_at
                  ? new Date(item.updated_at).toLocaleDateString()
                  : "—"}
              </span>
            </div>

            <div className="font-semibold text-[#1e40af]">
              €{Number(item.price || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyCourses() {
  const { profile } = useSelector((s) => s.user || {});
  const { data, isLoading, isError, error, refetch } = useGetMyEnrollmentsQuery();

  // your API returns { ok: true, enrollments: rows } OR just rows depending on your controller
  const enrollments = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.enrollments)) return data.enrollments;
    return [];
  }, [data]);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return enrollments;
    return enrollments.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [enrollments, q]);

  const name = profile?.full_name || "Student";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="animate-pulse space-y-4 mt-8 max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-[160px] bg-gray-200 rounded-[16px]" />
          <div className="h-[160px] bg-gray-200 rounded-[16px]" />
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
              Couldn’t load your courses
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
        {/* Heading */}
        <div className="text-center mb-[20px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>My courses</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.2] text-[#1e293b]">
            {name}'s Courses
          </h1>
          <p className="mt-[4px] text-[#475569] text-[15px]">
            Pick up where you left off.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[14px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] mb-[16px]">
          <div className="flex items-center gap-[10px]">
            <div className="shrink-0 text-[#64748b]">
              <Search size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your courses…"
              className="w-full outline-none text-[14px] text-[#0f172a] placeholder:text-[#94a3b8]"
            />
            {q ? (
              <button
                onClick={() => setQ("")}
                className="text-[13px] font-semibold text-[#4f46e5] hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* List */}
        {filtered.length ? (
          <div className="grid grid-cols-1 gap-[14px]">
            {filtered.map((e) => (
              <MyCourseCard key={e.course_id} item={e} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] text-[14px] text-[#475569]">
            You don’t have any courses yet.
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
      </main>
    </div>
  );
}