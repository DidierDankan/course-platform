// Column sizes from server/migrations/001_initial.sql. Validators read these, so a value the
// database can't store gets a 400 instead of a 500 (strict MySQL) or being cut short (loose MySQL).
// When a migration changes one of these columns, change it here in the same commit.

// TEXT holds 65,535 bytes and utf8mb4 uses up to 4 bytes a character, so 16,383 characters always fit.
const TEXT_CHARS = 16383;

export const LIMITS = {
  email: 191, // users.email VARCHAR(191)
  courseTitle: 255, // courses.title VARCHAR(255)
  courseDescription: TEXT_CHARS, // courses.description TEXT
  lessonTitle: 255, // course_media.title VARCHAR(255)
  lessonDescription: TEXT_CHARS, // course_media.description TEXT
  fullName: 255, // user_profiles.full_name VARCHAR(255)
  phone: 20, // user_profiles.phone VARCHAR(20)
  website: 255, // user_profiles.website VARCHAR(255)
  bio: TEXT_CHARS, // user_profiles.bio TEXT
  skill: 100, // user_skills.skill VARCHAR(100)
  qualificationTitle: 100, // qualifications.title VARCHAR(100)
  qualificationInstitution: 100, // qualifications.institution VARCHAR(100)
  qualificationDescription: TEXT_CHARS, // qualifications.description TEXT
  certificateUrl: TEXT_CHARS, // qualifications.certificate_url TEXT
};

// Largest value of a signed INT column (ids, duration, last_position_seconds).
export const INT_MAX = 2147483647;
