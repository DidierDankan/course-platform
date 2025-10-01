import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Header from "@components/ui/Header";
import QualificationsAccordion from "@components/ui/QualificationsAccordion";
import { ExternalLink, Phone, UserRound } from "lucide-react";
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
      <div className="p-4">
        <Header />
        <div className="animate-pulse space-y-4 mt-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }


  return (
    <div className="p-4">
      <Header />

      {/* Hero */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-start">

        <ProfileImg hideName={true} />
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.full_name || "User"}!
          </h1>

          {profile?.bio && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-1">About</h2>
              <p className="text-gray-800">{profile.bio}</p>
            </div>
          )}

          {profile?.email && (
            <div>
              <p className="text-gray-800">{profile.email}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            {profile?.phone && (
              <div className="inline-flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                <span>{profile.phone}</span>
              </div>
            )}

            {profile?.website && (
              <div className="inline-flex items-center gap-2 text-blue-700">
                <ExternalLink className="w-4 h-4" />
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

          {/* Skills as tags */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Skills</h2>
            <SkillTags skills={skills} />
          </div>
        </div>
      </div>

      {/* Qualifications (Accordion) */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Qualifications</h2>
          <Link to="/profile/edit" className="text-sm text-blue-700 hover:underline">
            Edit profile
          </Link>
        </div>

        <div className="mt-3">
          <QualificationsAccordion items={qualifications} />
        </div>
      </div>
    </div>
  );
};

export default Welcome;
