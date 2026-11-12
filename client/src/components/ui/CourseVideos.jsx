import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Film, Plus } from "lucide-react";
import Modal from "@components/ui/Modal";
import FormField from "@components/ui/Form/FormField";
import useObjectUrl from "@hooks/useObjectUrl";
import { LIMITS } from "@utils/form/limits";

const CourseVideos = ({ videos, onAdd, onRemove }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const fileInputRef = useRef(null);
  // Set when files are picked, so only that opens the popup: not loading a course or deleting a lesson.
  const openNewest = useRef(false);

  useEffect(() => {
    if (!openNewest.current || videos.length === 0) return;
    openNewest.current = false;
    setSelectedIndex(videos.length - 1);
  }, [videos.length]);

  const selectedVideo = selectedIndex !== null ? videos[selectedIndex] ?? null : null;
  const localUrl = useObjectUrl(selectedVideo?.file);
  const videoUrl = localUrl ?? selectedVideo?.url ?? null;

  const close = () => setSelectedIndex(null);

  return (
    <div>
      <span className="field-label">Lessons</span>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        aria-label="Add lesson videos"
        onChange={(e) => {
          openNewest.current = true;
          onAdd(e); // reads the file list right away, so the input can be cleared next
          e.target.value = ""; // lets the same file be picked again after removing it
        }}
      />

      <div className="video-tiles">
        {videos.map((video, index) => {
          const isIncomplete = !video.title?.trim() || !video.description?.trim();
          const name = video.title?.trim() || `Lesson ${index + 1}`;

          return (
            <button
              key={video.id ?? `new-${index}`}
              type="button"
              className="video-tile"
              onClick={() => setSelectedIndex(index)}
              aria-label={isIncomplete ? `${name}, missing details` : name}
              title={name}
            >
              <Film size={22} aria-hidden="true" />
              <small>{index + 1}</small>
              {isIncomplete && (
                <span className="video-tile-warning" aria-hidden="true">
                  <AlertTriangle size={12} />
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          className="video-tile video-tile-add"
          onClick={() => fileInputRef.current.click()}
          aria-label="Add lesson videos"
        >
          <Plus size={26} aria-hidden="true" />
        </button>
      </div>

      <Modal
        open={!!selectedVideo}
        onClose={close}
        title={`Lesson ${selectedIndex === null ? "" : selectedIndex + 1}`}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="text-button-danger"
              onClick={() => {
                onRemove(selectedIndex);
                close();
              }}
            >
              Delete lesson
            </button>
            <button type="button" className="button button-primary button-small" onClick={close}>
              Done
            </button>
          </>
        }
      >
        {selectedVideo && (
          <div className="seller-form">
            {videoUrl && <video key={videoUrl} src={videoUrl} controls className="watch-video video-preview" />}
            <FormField name={`videos[${selectedIndex}].title`} label="Lesson title" maxLength={LIMITS.lessonTitle} />
            <FormField
              name={`videos[${selectedIndex}].description`}
              label="Lesson description"
              as="textarea"
              rows={3}
              maxLength={LIMITS.lessonDescription}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CourseVideos;
