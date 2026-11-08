const ProgressBar = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="progress-label">
        <span>Progress</span>
        <strong>{pct}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
