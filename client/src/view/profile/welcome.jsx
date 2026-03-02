import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import QualificationsAccordion from "@components/ui/QualificationsAccordion";
import { ExternalLink, Phone, BookOpen } from "lucide-react";
import SkillTags from "@components/ui/SkillTags";
import ProfileImg from "@components/ui/ProfileImg";

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return parsed;
      return skills.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      return skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeQualifications = (qualifications) => {
  if (Array.isArray(qualifications)) return qualifications;
  if (typeof qualifications === "string") {
    try {
      const parsed = JSON.parse(qualifications);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const ensureHttp = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const Welcome = () => {
  const { profile, isLoading } = useSelector((state) => state.user);

  const skills = useMemo(() => normalizeSkills(profile?.skills), [profile?.skills]);
  const qualifications = useMemo(
    () => normalizeQualifications(profile?.qualifications),
    [profile?.qualifications]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="animate-pulse space-y-4 mt-8 max-w-[800px] mx-auto p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">

      <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
        {/* Badge + Heading */}
        <div className="text-center mb-[26px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Welcome back</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.2] text-[#1e293b]">
            {profile?.full_name || "Learner"}
          </h1>
          <p className="mt-[4px] text-[#475569] text-[15px]">
            Your personalized learning and teaching dashboard.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[16px] p-[24px] sm:p-[32px] grid grid-cols-1 md:grid-cols-[auto,1fr] gap-[24px] items-start">
          <ProfileImg hideName={true} />

          <div className="space-y-[16px]">
            {/* Bio */}
            {profile?.bio && (
              <div>
                <h2 className="text-[14px] font-semibold text-[#475569] mb-[4px]">
                  About
                </h2>
                <p className="text-[15px] text-[#0f172a] leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Contact */}
            <div className="flex flex-wrap gap-[14px] text-[14px]">
              {profile?.email && (
                <div className="inline-flex items-center gap-[6px] text-[#334155]">
                  <span className="font-medium">Email:</span> {profile.email}
                </div>
              )}
              {profile?.phone && (
                <div className="inline-flex items-center gap-[6px] text-[#334155]">
                  <Phone size={16} />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.website && (
                <div className="inline-flex items-center gap-[6px] text-[#1e40af]">
                  <ExternalLink size={16} />
                  <a
                    href={ensureHttp(profile.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 break-all"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-[14px] font-semibold text-[#475569] mb-[6px]">
                Skills
              </h2>
              <SkillTags skills={skills} />
            </div>
          </div>
        </div>

        {/* Qualifications */}
        <section className="mt-[36px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1e293b]">
              Qualifications
            </h2>
            <Link
              to="/profile/edit"
              className="text-[14px] text-[#4f46e5] font-medium hover:underline"
            >
              Edit Profile
            </Link>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <QualificationsAccordion items={qualifications} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Welcome;
