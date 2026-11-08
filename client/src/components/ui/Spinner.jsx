// Full-page loader: covers the page in the theme's background while the first data arrives.
export default function Spinner() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}
