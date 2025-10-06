import { useInfiniteCourses } from "@hooks/useInfiniteCourses";
import Header from "@components/ui/Header";
import Spinner from "@components/ui/Spinner";
import Footer from "@components/ui/Footer";
import { BookOpen } from "lucide-react";
import CourseCard from "@components/ui/CourseCard";

export default function HomePage() {
  const { courses, isLoading, isError, hasMore, loadMoreRef } = useInfiniteCourses(6);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <Header />

      {/* Hero */}
      <section className="max-w-[1100px] mx-auto px-[16px] mt-[18px]">
        <div className="text-center">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Welcome to LearnHub</span>
          </div>

          <h1 className="text-[28px] sm:text-[36px] font-extrabold leading-[1.15]">
            Learn new skills with curated, practical courses.
          </h1>
          <p className="mt-[10px] text-[14px] sm:text-[16px] text-[#475569]">
            Bite-sized lessons, real projects, and instructors who ship.
          </p>
        </div>

        <div className="mt-[18px]">
          <img
            className="w-full h-[260px] sm:h-[340px] object-cover rounded-[14px] border border-[#e5e7eb] shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
            alt="People learning online"
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=2000&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Courses */}
      <section className="max-w-[1100px] mx-auto px-[16px] mt-[22px] pb-[40px]">
        <h2 className="text-[18px] sm:text-[20px] font-bold mb-[12px]">Popular Courses</h2>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-[#b91c1c] text-[14px]">Failed to load courses.</p>
        ) : courses.length === 0 ? (
          <p className="text-[#475569] text-[14px]">No courses yet. Check back soon!</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="mt-[16px] h-[1px] bg-transparent" />
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
