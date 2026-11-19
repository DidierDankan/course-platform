// server/lib/demoContent.js
// The public demo: the accounts and courses `npm run seed:demo` creates. The seed writes them, db/DemoService.js finds
// them again for the daily reset, and the login page lists the two public accounts (client/src/utils/demo/index.js
// holds the same emails: keep them in sync).

// .test is a reserved TLD: these addresses can never belong to a real person.
export const DEMO_INSTRUCTOR_EMAIL = "demo-instructor@lumen.test";
export const DEMO_STUDENT_EMAIL = "demo-student@lumen.test";

export const DEMO_SELLER = {
  email: DEMO_INSTRUCTOR_EMAIL,
  role: "seller",
  fullName: "Maya Chen",
  bio: "Photographer and ceramicist. I teach the slow, hands-on version of every craft.",
  qualification: { title: "BA Fine Arts", institution: "Lumen Demo Academy" },
};
export const DEMO_STUDENT = { email: DEMO_STUDENT_EMAIL, role: "user", fullName: "Sam Rivera" };

// Titles, copy and prices from the reference designs (design/*/src/App.tsx). Thumbnails are the cinematic contact-sheet
// tiles: one image per course, like a seller would upload. A course is identified by (demo seller, title).
export const DEMO_COURSES = [
  {
    title: "Form & fire: the art of hand-built ceramics",
    description: "Learn hand-building techniques and create beautiful, useful pieces without a wheel.",
    price: 89,
    thumbnail: "ceramics.jpg",
    lessons: ["Wedging and pinch pots", "Coil building a vessel"],
  },
  {
    title: "Cinema in stills: visual storytelling",
    description: "Find your visual voice and tell honest stories through everyday moments.",
    price: 74,
    thumbnail: "film.jpg",
    lessons: ["Seeing in frames", "Light, shadow and mood"],
  },
  {
    title: "Bold marks: abstract painting in motion",
    description: "Build a playful studio practice through colour, composition, and expressive mark-making.",
    price: 65,
    thumbnail: "painting.jpg",
    lessons: ["Colour before composition", "Gesture and the loaded brush"],
  },
  {
    title: "Slow bread: sourdough from scratch",
    description: "Master a dependable starter, intuitive dough handling, and the perfect golden crust.",
    price: 59,
    thumbnail: "bread.jpg",
    lessons: ["Building a starter", "Shaping and the first bake"],
  },
];
export const LESSONS_PER_COURSE = 2;

// The demo student is enrolled in this course (index into DEMO_COURSES), half done, and has favorited another.
export const ENROLLED_COURSE = 1;
export const FAVORITE_COURSE = 0;
export const STUDENT_PROGRESS = 50; // 1 of 2 lessons completed, matching how the server computes progress
