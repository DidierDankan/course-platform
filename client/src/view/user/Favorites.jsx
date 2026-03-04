import { Heart } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import CourseCard from "@components/ui/CourseCard";
import { useGetMyFavoritesQuery } from "@api/modules/favoritesApi";

export default function FavoritesPage() {
  const { data, isLoading, isError } = useGetMyFavoritesQuery();

  const favorites = data?.favorites || [];

  console.log("FAVORITES", favorites)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pt-[72px]">
      <main className="max-w-[1100px] mx-auto px-[16px] py-[20px]">
        <div className="text-center mb-[18px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <Heart size={14} className="text-[#ef4444]" />
            <span>Favorites</span>
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.15] text-[#1e293b]">
            Saved courses
          </h1>
          <p className="mt-[6px] text-[14px] text-[#475569]">
            Your bookmarked courses in one place.
          </p>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <div className="text-[#b91c1c] text-[14px]">Failed to load favorites.</div>
        ) : favorites.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] text-[14px] text-[#475569]">
            No favorites yet. Click the heart on any course to save it.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mt-[12px]">
            {favorites.map((c) => (
              <CourseCard key={c.course_id || c.id} course={{ ...c, id: c.course_id ?? c.id }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}