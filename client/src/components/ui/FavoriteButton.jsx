import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useCheckFavoriteQuery,
} from "@api/modules/favoritesApi";

// Heart toggle from the reference (.favorite). Logged-out visitors are sent to login and come back.
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
  const label = favorited ? "Remove from favorites" : "Add to favorites";

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
    } catch {
      // The heart keeps showing the server's state (the check query is the source of truth),
      // so a failed toggle simply doesn't change it; there is nothing else to undo.
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      className={`favorite ${favorited ? "is-favorite" : ""} ${className}`}
      aria-label={label}
      aria-pressed={favorited}
      title={label}
    >
      <Heart size={18} aria-hidden="true" />
    </button>
  );
}
