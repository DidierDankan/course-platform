export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration); // duration in seconds
      };

      video.onerror = (err) => reject(err);
      video.src = URL.createObjectURL(file);
    } catch (err) {
      reject(err);
    }
  });
};