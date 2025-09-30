import { useState, useEffect } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";

const CourseVideos = ({ videos, onAdd, onRemove, onUpdate }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [videoURL, setVideoURL] = useState(null);

  // Automatically open the last added video
  useEffect(() => {
    if (videos.length > 0) {
      setSelectedIndex(videos.length - 1);
    }
  }, [videos.length]);

  const selectedVideo =
    selectedIndex !== null && videos[selectedIndex]
      ? videos[selectedIndex]
      : null;

  useEffect(() => {
    if (selectedVideo?.file) {
      const url = URL.createObjectURL(selectedVideo.file);
      setVideoURL(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoURL(null);
    }
  }, [selectedVideo?.file]);

  return (
    <div>
      <label className="block font-medium mb-1">Course Videos</label>

      {/* Add Video Button */}
      <button
        type="button"
        onClick={() => document.getElementById("video-upload").click()}
        className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg hover:border-blue-500 hover:bg-gray-50 transition"
      >
        <Plus size={32} className="text-gray-600" />
      </button>

      {/* Hidden file input */}
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        multiple
        onChange={onAdd}
        className="hidden"
      />

      {/* Thumbnails */}
      {videos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {videos.map((vid, idx) => {
            const isIncomplete = !vid.title?.trim() || !vid.description?.trim();

            return (
              <div
                key={idx}
                className="relative w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md shadow cursor-pointer hover:scale-105 transition"
                onClick={() => setSelectedIndex(idx)}
              >
                <span className="text-[24px]">🎥</span>
                {isIncomplete && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[12px] rounded-full p-1 shadow flex items-center justify-center">
                    <AlertTriangle size={12} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedVideo && (
        <div className="fixed top-[0px] right-[0px] bottom-[0px] left-[0px] bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-neutral-900 p-4 rounded-lg shadow-xl max-w-3xl w-full mx-4">
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>

            {/* Video stays mounted */}
            {videoURL && (
              <video
                key={selectedIndex}
                src={videoURL}
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-md"
              />
            )}

            {/* Editable fields */}
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Video Title"
                className="input w-full"
                value={selectedVideo.title}
                onChange={(e) =>
                  onUpdate(selectedIndex, "title", e.target.value)
                }
              />
              <textarea
                placeholder="Video Description"
                className="input w-full"
                value={selectedVideo.description}
                onChange={(e) =>
                  onUpdate(selectedIndex, "description", e.target.value)
                }
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  onRemove(selectedIndex);
                  setSelectedIndex(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete Video
              </button>
              <button
                onClick={() => setSelectedIndex(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseVideos;
