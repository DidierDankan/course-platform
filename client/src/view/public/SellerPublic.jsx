import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ExternalLink, Lock } from "lucide-react";
import { useGetSellerPublicQuery } from "@api/modules/publicApi";
import CourseCard from "@components/ui/CourseCard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const normalizeMediaUrl = (p) => {
  if (!p) return "";
  // already absolute
  if (/^https?:\/\//i.test(p)) return p;

  // already starts with /
  if (p.startsWith("/")) return `${API_BASE_URL}${p}`;

  // filename only -> assume uploads
  return `${API_BASE_URL}/uploads/${p}`;
};

const ensureHttp = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const SellerPublic = () => {
  const { sellerId } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetSellerPublicQuery(sellerId, {
    skip: !sellerId,
  });

  const seller = data?.seller || null;
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const isAuthed = !!data?.isAuthenticated;

  const avatar = normalizeMediaUrl(seller?.profile_image) ||
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop";

  const skills = useMemo(() => {
    const s = seller?.skills;
    return Array.isArray(s) ? s : [];
  }, [seller?.skills]);

  const qualifications = useMemo(() => {
    const q = seller?.qualifications;
    return Array.isArray(q) ? q : [];
  }, [seller?.qualifications]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="animate-pulse space-y-4 mt-8 max-w-[1100px] mx-auto px-[16px] py-[28px]">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-[160px] bg-gray-200 rounded-[16px]" />
          <div className="h-[260px] bg-gray-200 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (isError || !data?.ok) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        <main className="max-w-[1100px] mx-auto px-[16px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="text-[18px] font-bold text-[#1e293b]">
              Couldn’t load instructor
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

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        <main className="max-w-[1100px] mx-auto px-[16px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            Seller not found.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pt-[72px]">
      <main className="max-w-[1100px] mx-auto px-[16px] py-[28px]">
        {/* Badge + heading */}
        <div className="text-center mb-[22px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Instructor</span>
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.2] text-[#1e293b]">
            {seller.full_name || "Instructor"}
          </h1>

          <p className="mt-[4px] text-[#475569] text-[15px]">
            Browse courses and learn from this instructor.
          </p>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[16px] p-[18px] sm:p-[22px] flex flex-col sm:flex-row gap-[16px] items-start">
          <img
            src={avatar}
            alt="Instructor avatar"
            className="w-[92px] h-[92px] rounded-[14px] object-cover border border-[#e2e8f0]"
            loading="lazy"
          />

          <div className="flex-1 space-y-[10px]">
            {/* Public-safe (always visible): name only basically */}
            <div className="text-[14px] text-[#475569]">
              Instructor ID: <span className="font-semibold text-[#0f172a]">#{seller.id}</span>
            </div>

            {/* Private-ish section */}
            {!isAuthed ? (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] p-[14px]">
                <div className="flex items-center gap-[8px] text-[#0f172a] font-semibold">
                  <Lock size={16} />
                  Instructor details are visible after login
                </div>
                <div className="mt-[6px] text-[14px] text-[#475569]">
                  Sign in to view bio, skills, qualifications and links.
                </div>
                <div className="mt-[10px]">
                  <Link
                    to="/auth/login"
                    className="inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {seller.bio ? (
                  <div>
                    <div className="text-[14px] font-semibold text-[#475569] mb-[4px]">
                      About
                    </div>
                    <p className="text-[15px] text-[#0f172a] leading-relaxed">
                      {seller.bio}
                    </p>
                  </div>
                ) : null}

                {seller.website ? (
                  <div className="inline-flex items-center gap-[6px] text-[14px] text-[#1e40af]">
                    <ExternalLink size={16} />
                    <a
                      href={ensureHttp(seller.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 break-all"
                    >
                      {seller.website}
                    </a>
                  </div>
                ) : null}

                {skills.length ? (
                  <div>
                    <div className="text-[14px] font-semibold text-[#475569] mb-[6px]">
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-[8px]">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="text-[12px] px-[10px] py-[4px] rounded-[999px] bg-[#eef2ff] text-[#3730a3] border border-[#e0e7ff]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {qualifications.length ? (
                  <div>
                    <div className="text-[14px] font-semibold text-[#475569] mb-[6px]">
                      Qualifications
                    </div>

                    <div className="space-y-[10px]">
                      {qualifications.map((q, idx) => (
                        <div
                          key={idx}
                          className="border border-[#e2e8f0] rounded-[12px] p-[12px] bg-[#ffffff]"
                        >
                          <div className="font-semibold text-[#0f172a]">
                            {q.title}
                          </div>
                          {q.institution ? (
                            <div className="text-[13px] text-[#475569]">
                              {q.institution}
                            </div>
                          ) : null}
                          {q.description ? (
                            <div className="text-[13px] text-[#475569] mt-[4px]">
                              {q.description}
                            </div>
                          ) : null}
                          {q.certificate_url ? (
                            <a
                              href={ensureHttp(q.certificate_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[13px] text-[#4f46e5] font-semibold hover:underline mt-[6px] inline-block"
                            >
                              View certificate
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Courses */}
        <section className="mt-[22px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold">
              Courses by {seller.full_name || "this instructor"}
            </h2>

            <Link to="/courses" className="text-[14px] text-[#4f46e5] font-medium hover:underline">
              Browse all
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] text-[14px] text-[#475569]">
              No courses published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {courses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="block">
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SellerPublic;