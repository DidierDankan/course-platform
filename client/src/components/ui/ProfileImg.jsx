import React, { useMemo, useState } from "react";
import { useGetProfileQuery } from "@api/modules/userApi";

/** Build a full URL from your API + common upload shapes */
const resolveImageUrl = (img) => {
  if (!img) return "/default-avatar.png";
  if (/^https?:\/\//i.test(img)) return img; // already absolute
  const path = img.includes("uploads/") ? img.replace(/^\//, "") : `uploads/${img}`;
  return `${import.meta.env.VITE_API_URL}/${path}`;
};

/**
 * ProfileAvatar (fetches profile internally)
 * Props:
 *  - size: number (px) -> default 150
 *  - className / wrapperClassName: extra classes
 *  - src: string (optional override)
 *  - name: string (optional override)
 *  - hideName: boolean (default false)
 *  - clickable: boolean (adds cursor-pointer)
 */
const ProfileImg = ({
  size = 150,
  className = "",
  wrapperClassName = "",
  src,
  name,
  hideName = false,
  clickable = false,
}) => {
  const { data: profile, isLoading, isError } = useGetProfileQuery();
  const [broken, setBroken] = useState(false);

  const effectiveName = name ?? profile?.full_name ?? "Profile photo";
  const effectiveSrc = useMemo(() => {
    // prefer explicit prop, then API value
    const candidate = src ?? profile?.profile_image;
    if (!candidate || broken) return "/default-avatar.png";
    return resolveImageUrl(candidate);
  }, [src, profile?.profile_image, broken]);

  if (isLoading && !src) {
    // simple skeleton while fetching
    return (
      <div className={`flex flex-col items-center ${wrapperClassName}`}>
        <div
          className="rounded-full animate-pulse bg-gray-300/60 dark:bg-neutral-700"
          style={{ width: size, height: size }}
        />
        {!hideName && (
          <div className="mt-2 h-3 w-24 rounded bg-gray-300/60 dark:bg-neutral-700 animate-pulse" />
        )}
      </div>
    );
  }

  const imgEl = (
    <img
      src={effectiveSrc}
      alt={effectiveName}
      onError={() => setBroken(true)}
      className={[
        "rounded-full object-cover border",
        clickable ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );

  return (
    <div className={`flex flex-col items-center ${wrapperClassName}`}>
      {imgEl}
      {!hideName && (
        <div className="mt-3 text-gray-600 dark:text-gray-300 text-sm font-medium">
          {effectiveName}
        </div>
      )}
      {/* Optional error hint (only if fetching failed and no override provided) */}
      {isError && !src && (
        <div className="mt-1 text-xs text-red-500">Couldn’t load profile image.</div>
      )}
    </div>
  );
};

export default ProfileImg;
