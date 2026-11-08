import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ExternalLink, Mail, Phone } from "lucide-react";
import QualificationsAccordion from "@components/ui/QualificationsAccordion";
import SkillTags from "@components/ui/SkillTags";
import ProfileImg from "@components/ui/ProfileImg";
import { ensureHttp } from "@utils/url";

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

const Welcome = () => {
  const { profile, isLoading } = useSelector((state) => state.user);

  const skills = useMemo(() => normalizeSkills(profile?.skills), [profile?.skills]);
  const qualifications = useMemo(
    () => normalizeQualifications(profile?.qualifications),
    [profile?.qualifications]
  );

  if (isLoading) {
    return (
      <main className="page-main page-main-narrow">
        <div className="page-inline-loader" role="status" aria-label="Loading profile">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">Welcome back</span>
        <h1>{profile?.full_name || "Your profile"}</h1>
        <p>Your teaching profile, as you&apos;ve set it up.</p>
      </header>

      <section className="panel profile-card" aria-label="Profile">
        <ProfileImg />

        <div className="profile-details">
          {profile?.bio && (
            <div>
              <h2 className="stat-label">About</h2>
              <p className="profile-bio">{profile.bio}</p>
            </div>
          )}

          <div className="profile-contact">
            {profile?.email && (
              <span>
                <Mail size={16} aria-hidden="true" />
                {profile.email}
              </span>
            )}
            {profile?.phone && (
              <span>
                <Phone size={16} aria-hidden="true" />
                {profile.phone}
              </span>
            )}
            {profile?.website && (
              <span>
                <ExternalLink size={16} aria-hidden="true" />
                <a href={ensureHttp(profile.website)} target="_blank" rel="noreferrer" className="text-link">
                  {profile.website}
                </a>
              </span>
            )}
          </div>

          <div>
            <h2 className="stat-label profile-label">Skills</h2>
            <SkillTags skills={skills} />
          </div>
        </div>
      </section>

      <section className="student-section" aria-labelledby="qualifications-title">
        <div className="profile-section-head">
          <h2 id="qualifications-title">Qualifications</h2>
          <Link to="/profile/edit" className="text-link">
            Edit profile
          </Link>
        </div>
        <div className="panel">
          <QualificationsAccordion items={qualifications} />
        </div>
      </section>
    </main>
  );
};

export default Welcome;
