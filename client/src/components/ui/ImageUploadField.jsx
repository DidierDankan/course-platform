import { useEffect, useState } from 'react';
import { ErrorMessage, useFormikContext } from 'formik';

const ImageUploadField = () => {
  const { values, setFieldValue } = useFormikContext();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (values.profile_image && typeof values.profile_image === 'string') {
      // ✅ Ensure preview always points to /uploads/filename.png
      const imagePath = values.profile_image.startsWith('uploads/')
        ? `/${values.profile_image}`
        : `${import.meta.env.VITE_API_URL}/uploads/${values.profile_image}`;

      setPreview(imagePath);
    }
  }, [values.profile_image]);

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue('profile_image', file); // store file object in Formik
      setPreview(URL.createObjectURL(file)); // show preview for unsaved file
    }
  };

  console.log("VALUES", values)
  console.log("PREVIEW", preview)

  return (
    <div className="mb-4">
      <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700">
        Profile Image
      </label>

      <input
        id="profile_image"
        name="profile_image"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
      />

      <ErrorMessage
        name="profile_image"
        component="div"
        className="text-red-500 text-sm mt-1"
      />

      {preview && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            {typeof values.profile_image === 'string'
              ? 'Current Image:'
              : 'Preview (unsaved):'}
          </p>
          <img
            src={preview}
            alt="Profile"
            className="mt-2 rounded-md w-32 h-32 object-cover border"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
