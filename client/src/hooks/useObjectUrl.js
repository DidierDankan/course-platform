import { useEffect, useState } from "react";

// A temporary address for previewing a picked file. It holds the file in memory until revoked,
// so it's released when the file changes or the component goes away.
export default function useObjectUrl(file) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!(file instanceof File)) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
