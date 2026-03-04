import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useCheckFavoriteQuery,
} from "@api/modules/favoritesApi";

export default function FavoriteButton({ courseId, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const { data, isFetching } = useCheckFavoriteQuery(courseId, {
    skip: !isAuthenticated || !courseId,
  });

  const [addFav, { isLoading: adding }] = useAddFavoriteMutation();
  const [removeFav, { isLoading: removing }] = useRemoveFavoriteMutation();

  const favorited = !!data?.favorited;
  const busy = isFetching || adding || removing;

  const onToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }

    try {
      if (favorited) await removeFav(courseId).unwrap();
      else await addFav(courseId).unwrap();
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`inline-flex items-center justify-center rounded-[12px] border border-[#e2e8f0] bg-white/80 backdrop-blur px-[10px] py-[8px]
        shadow-[0_6px_18px_rgba(0,0,0,0.06)] hover:bg-white disabled:opacity-60 ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={18}
        className={favorited ? "fill-[#ef4444] text-[#ef4444]" : "text-[#475569]"}
      />
    </button>
  );
}