import { useRef, useState } from "react";
import { getIn, useFormikContext } from "formik";
import { User } from "lucide-react";
import useObjectUrl from "@hooks/useObjectUrl";
import { uploadUrl } from "@utils/url";

const ImageUploadField = () => {
  const { values, errors, touched, setFieldValue } = useFormikContext();
  const fileInputRef = useRef(null);
  const [brokenSrc, setBrokenSrc] = useState(null);

  const value = values.profile_image;
  const localPreview = useObjectUrl(value);

  const preview = localPreview ?? (typeof value === "string" ? uploadUrl(value) : null);
  const error = getIn(touched, "profile_image") ? getIn(errors, "profile_image") : undefined;

  return (
    <div className="avatar-field">
      {preview && preview !== brokenSrc ? (
        <img className="avatar" src={preview} alt="Your profile" onError={() => setBrokenSrc(preview)} />
      ) : (
        <div className="avatar avatar-empty" aria-hidden="true">
          <User size={64} />
        </div>
      )}

      <div>
        <span className="field-label">Profile picture</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-label="Profile picture"
          onChange={(e) => {
            const file = e.currentTarget.files[0];
            if (file) setFieldValue("profile_image", file);
          }}
        />
        <button type="button" className="button button-secondary button-small" onClick={() => fileInputRef.current.click()}>
          {preview ? "Change photo" : "Upload photo"}
        </button>
        <small className={`field-message ${error ? "is-error" : ""}`}>{error || "JPG, PNG, WebP or GIF"}</small>
      </div>
    </div>
  );
};

export default ImageUploadField;
