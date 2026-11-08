const Tag = ({ children, className = "", as: As = "span", ...props }) => (
  <As className={`tag ${className}`} {...props}>
    {children}
  </As>
);

export default Tag;
