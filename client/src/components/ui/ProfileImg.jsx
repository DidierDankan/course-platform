import { useState } from "react";
import { User } from "lucide-react";
import { useGetProfileQuery } from "@api/modules/userApi";

const resolveImageUrl = (img) => {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  const path = img.includes("uploads/") ? img.replace(/^\//, "") : `uploads/${img}`;
  return `${import.meta.env.VITE_API_URL}/${path}`;
};

// The signed-in user's photo. Without one, or if it fails to load, a themed placeholder is shown.
const ProfileImg = () => {
  const { data: profile, isLoading } = useGetProfileQuery();
  // Remembers which address failed, so saving a new photo tries again.
  const [brokenSrc, setBrokenSrc] = useState(null);

  const name = profile?.full_name ?? "Profile photo";
  const src = resolveImageUrl(profile?.profile_image);

  if (isLoading) return <div className="avatar avatar-loading" aria-hidden="true" />;

  if (!src || src === brokenSrc) {
    return (
      <div className="avatar avatar-empty" role="img" aria-label={name}>
        <User size={64} aria-hidden="true" />
      </div>
    );
  }

  return <img className="avatar" src={src} alt={name} onError={() => setBrokenSrc(src)} />;
};

export default ProfileImg;
