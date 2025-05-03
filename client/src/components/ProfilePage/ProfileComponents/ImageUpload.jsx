import { useEffect, useState } from "react";
import { FaPen } from "react-icons/fa";
import PropTypes from "prop-types";

const ImageUpload = ({ profilePicPath, setProfilePic }) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  const [imagePreview, setImagePreview] = useState(
    profilePicPath ? `${serverUrl}/public${profilePicPath}` : null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (profilePicPath) {
      setImagePreview(`${serverUrl}/public${profilePicPath}`);
    }
  }, [profilePicPath]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, JPEG, and PNG files are allowed");
        return;
      }
      setError("");
      setProfilePic(file); // Pass the file to the parent component
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-fit mx-auto relative">
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-40 h-40 border-2 border-gray-300 border-dashed rounded-full cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-40 h-40 rounded-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {"(PNG, JPG, JPEG only)"}
            </p>
          </div>
        )}
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          accept="image/jpeg, image/jpg, image/png"
          onChange={handleImageUpload}
        />
        <div className=" p-2 border border-white rounded-full bg-grey absolute bottom-0 right-1">
          <FaPen />
        </div>
      </label>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

ImageUpload.propTypes = {
  profilePicPath: PropTypes.string,
  setProfilePic: PropTypes.func.isRequired,
};

export default ImageUpload;
