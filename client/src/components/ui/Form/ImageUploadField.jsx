import { useEffect, useRef, useState } from 'react';
import { ErrorMessage, useFormikContext } from 'formik';

const ImageUploadField = () => {
  const { values, setFieldValue } = useFormikContext();
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (values.profile_image && typeof values.profile_image === 'string') {
      const imagePath = values.profile_image.startsWith('uploads/')
        ? `/${values.profile_image}`
        : `${import.meta.env.VITE_API_URL}/uploads/${values.profile_image}`;

      setPreview(imagePath);
    }
  }, [values.profile_image]);

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue('profile_image', file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700">
        Profile Image
      </label>

      {/* Hidden input */}
      <input
        id="profile_image"
        name="profile_image"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      <ErrorMessage
        name="profile_image"
        component="div"
        className="text-red-500 text-sm mt-1"
      />

      {/* Clickable container */}
      <div
        className={`relative mt-4 w-[150px] h-[150px] cursor-pointer rounded-full overflow-hidden border-2 group 
          ${preview ? 'border-gray-300' : 'border-dashed border-gray-400 bg-gray-50'}`}
        onClick={() => fileInputRef.current.click()}
      >
        {/* Image */}
        <img
          src={preview || '/default-avatar.png'}
          alt="Profile"
          className="absolute w-full h-full object-cover rounded-full"
        />

        {/* Overlay */}
        <div
          className="absolute w-full h-full inset-0 bg-black/40 flex items-center justify-center rounded-full 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
          <span className="text-white text-sm font-semibold">
            {preview ? 'Change' : 'Upload'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
