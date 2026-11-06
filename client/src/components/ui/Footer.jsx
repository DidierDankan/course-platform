import { Link } from "react-router-dom";
import { APP_NAME } from "@utils/brand";
import Logo from "@components/ui/Logo";

// Only links to pages that exist. Add a link here when its page ships, not before.
const FOOTER_GROUPS = [
  { title: "Explore", links: [{ to: "/courses", label: "All courses" }] },
  {
    title: APP_NAME,
    links: [
      { to: "/auth/register", label: "Teach with us" },
      { to: "/styleguide", label: "Style guide" },
    ],
  },
];

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-top">
      <div>
        <Logo className="logo-light" />
        <p>Remarkable teachers. Unforgettable lessons.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <span>{group.title}</span>
            {group.links.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
    <div className="footer-bottom">
      <span>
        © {new Date().getFullYear()} {APP_NAME}
      </span>
      <span>Independent learning, worldwide</span>
    </div>
  </footer>
);

export default Footer;
