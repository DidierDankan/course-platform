import { FormEvent, useEffect, useState } from "react"

type IconProps = { size?: number filled?: boolean className?: string }

const Search = ({ size = 20 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
)

const Arrow = ({ size = 18 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M5 12h14M14 7l5 5-5 5" />
  </svg>
)

const Heart = ({ size = 19, filled = false }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  </svg>
)

const Menu = ({ size = 23 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M4 7h16M4 17h16" />
  </svg>
)

const Close = ({ size = 22 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

const Check = ({ size = 18 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
)

const Play = ({ size = 20 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M8 5.8v12.4c0 .8.9 1.3 1.6.8l9.3-6.2c.6-.4.6-1.2 0-1.6L9.6 5c-.7-.5-1.6 0-1.6.8Z" />
  </svg>
)

const ImageCrop = ({
  crop,
  className = "",
}: {
  crop: number
  className?: string
}) => (
  <div
    className={`course-image crop-${crop} ${className}`}
    role="img"
    aria-label={
      [
        "Handmade ceramic vessel",
        "Vintage analog camera",
        "Abstract painting materials",
        "Artisan sourdough bread",
      ][crop]
    }
  />
)

const courses = [
  {
    title: "Form & fire: the art of hand-built ceramics",
    instructor: "Didier Laurent",
    description:
      "Learn hand-building techniques and create beautiful, useful pieces without a wheel.",
    duration: "6h 20min",
    price: "89",
    crop: 0,
    label: "Bestseller",
  },
  {
    title: "Cinema in stills: visual storytelling",
    instructor: "Maya Chen",
    description:
      "Find your visual voice and tell honest stories through everyday moments.",
    duration: "4h 45min",
    price: "74",
    crop: 1,
    label: "New",
  },
  {
    title: "Bold marks: abstract painting in motion",
    instructor: "Nia Santos",
    description:
      "Build a playful studio practice through colour, composition, and expressive mark-making.",
    duration: "5h 10min",
    price: "65",
    crop: 2,
    label: "Editor’s pick",
  },
  {
    title: "Slow bread: sourdough from scratch",
    instructor: "Jon Bell",
    description:
      "Master a dependable starter, intuitive dough handling, and the perfect golden crust.",
    duration: "3h 35min",
    price: "59",
    crop: 3,
    label: "Popular",
  },
]

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`logo ${light ? "logo-light" : ""}`}
      href="#home"
      aria-label="Lumen home"
    >
      Lumen<span>.</span>
    </a>
  )
}

function Header({ onStyleGuide }: { onStyleGuide: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav
          className={`header-nav ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#popular" onClick={() => setOpen(false)}>
            Browse
          </a>
          <button className="nav-link" onClick={onStyleGuide}>
            Style guide
          </button>
          <a href="#signin" onClick={() => setOpen(false)}>
            Sign in
          </a>
          <a
            className="button button-primary button-small"
            href="#join"
            onClick={() => setOpen(false)}
          >
            Join now <Arrow size={15} />
          </a>
        </nav>
        <button
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>
    </header>
  )
}

function CourseCard({
  course,
  action = "buy",
  progress = 0,
}: {
  course: typeof courses[number]
  action?: "buy" | "login" | "redirect" | "continue"
  progress?: number
}) {
  const [favorite, setFavorite] = useState(false)
  const actionText = {
    buy: `Buy for $${course.price}`,
    login: "Login to buy",
    redirect: "Redirecting…",
    continue: "Continue learning",
  }[action]

  return (
    <article className="course-card">
      <div className="card-visual">
        <ImageCrop crop={course.crop} />
        <span className="card-label">{course.label}</span>
        <span className="preview-play">
          <Play size={16} />
        </span>
        <button
          className={`favorite ${favorite ? "is-favorite" : ""}`}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => setFavorite(!favorite)}
        >
          <Heart filled={favorite} />
        </button>
      </div>
      <div className="card-body">
        <h3>{course.title}</h3>
        <a href="#instructor" className="instructor">
          By {course.instructor}
        </a>
        <p>{course.description}</p>
        <div className="card-meta">
          <span>{course.duration}</span>
          <span>Self-paced</span>
          <span>${course.price}</span>
        </div>
        {action === "continue" && (
          <div className="mini-progress" aria-label={`${progress}% complete`}>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>{progress}% complete</small>
          </div>
        )}
        <button
          className={`card-action ${action === "redirect" ? "is-loading" : ""}`}
          disabled={action === "redirect"}
        >
          {action === "redirect" && <span className="spinner" />}
          {actionText}
          {action !== "redirect" && <Arrow size={16} />}
        </button>
      </div>
    </article>
  )
}

function Home({ onStyleGuide }: { onStyleGuide: () => void }) {
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")

  function search(event: FormEvent) {
    event.preventDefault()
    setMessage(
      query.trim()
        ? `Showing courses for “${query.trim()}”`
        : "Try a subject like ceramics or photography.",
    )
  }

  return (
    <div id="home">
      <Header onStyleGuide={onStyleGuide} />
      <main>
        <section className="hero">
          <div className="hero-media">
            <ImageCrop crop={0} />
            <div className="hero-shade" />
            <div className="hero-content">
              <div className="hero-kicker">
                <span className="live-dot" /> Big skills. Zero boring.
              </div>
              <h1>
                Learn from people who <em>live</em> the craft.
              </h1>
              <p>
                Brilliant video courses from independent makers. Buy once, learn
                your way, keep forever.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#popular">
                  <Play size={15} /> Explore courses
                </a>
                <button className="trailer-button">
                  <span>
                    <Play size={14} />
                  </span>{" "}
                  Free preview · 1:24
                </button>
              </div>
            </div>
            <div className="hero-side-note">
              <span>Free preview</span>
              <strong>Form & fire</strong>
              <small>with Didier Laurent</small>
            </div>
          </div>
          <div className="search-dock">
            <form className="search-bar" onSubmit={search}>
              <Search size={20} />
              <label className="sr-only" htmlFor="course-search">
                Search courses, skills, or instructors
              </label>
              <input
                id="course-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, skills, or instructors"
              />
              <button type="submit">
                Search <Arrow size={16} />
              </button>
            </form>
            {message && (
              <p className="search-message" role="status">
                {message}
              </p>
            )}
            <div className="topic-line">
              <span>Trending</span>
              <a href="#popular">Photography</a>
              <a href="#popular">Ceramics</a>
              <a href="#popular">Cooking</a>
              <a href="#popular">Illustration</a>
            </div>
          </div>
        </section>

        <section className="courses-section" id="popular">
          <div className="section-heading">
            <div>
              <span className="section-index">01 / Popular courses</span>
              <h2>Find your next obsession.</h2>
            </div>
            <a className="text-link" href="#all-courses">
              View all courses <Arrow />
            </a>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.title} course={course} />
            ))}
          </div>
        </section>

        <section className="teach-section" id="join">
          <div className="teach-number">
            <Play size={20} />
          </div>
          <div>
            <span className="section-index">Teach on Lumen</span>
            <h2>
              Your knowledge.
              <br />
              Your rules.
            </h2>
          </div>
          <div className="teach-copy">
            <p>
              Build a course on your terms. We give independent instructors the
              tools and support to turn deep expertise into courses people want
              to finish.
            </p>
            <a className="button button-ink" href="#teach">
              Become an instructor <Arrow size={17} />
            </a>
          </div>
        </section>
      </main>
      <Footer onStyleGuide={onStyleGuide} />
    </div>
  )
}

function Footer({ onStyleGuide }: { onStyleGuide: () => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Logo light />
          <p>Learn loud. Make something brilliant.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>Explore</span>
            <a href="#popular">All courses</a>
            <a href="#popular">Categories</a>
            <a href="#popular">Instructors</a>
          </div>
          <div>
            <span>Lumen</span>
            <a href="#about">Our story</a>
            <a href="#teach">Teach with us</a>
            <button onClick={onStyleGuide}>Style guide</button>
          </div>
          <div>
            <span>Follow</span>
            <a href="#instagram">Instagram</a>
            <a href="#youtube">YouTube</a>
            <a href="#newsletter">Newsletter</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 Lumen Learning Ltda.</span>
        <span>Terms · Privacy</span>
        <span>Independent learning, worldwide</span>
      </div>
    </footer>
  )
}

function StyleGuide({ onHome }: { onHome: () => void }) {
  const [toggle, setToggle] = useState(true)
  const [toast, setToast] = useState(true)
  const [tag, setTag] = useState(true)

  return (
    <div className="style-page">
      <header className="guide-header">
        <Logo />
        <div>
          <span>Design system</span>
          <strong>v1.0 / 2025</strong>
        </div>
        <button
          className="button button-secondary button-small"
          onClick={onHome}
        >
          Back to home <Arrow size={15} />
        </button>
      </header>
      <main className="guide-main">
        <div className="guide-title">
          <span className="section-index">Lumen foundations & components</span>
          <h1>
            Loud ideas.
            <br />
            Clear rules.
          </h1>
          <p>
            A bold, tactile system built for curious people and independent
            teachers who refuse to blend in.
          </p>
        </div>

        <GuideSection number="01" title="Colour palette">
          <div className="swatch-grid">
            {[
              ["Cream", "#FFF8E7", "swatch-paper"],
              ["Black", "#111111", "swatch-ink"],
              ["Electric yellow", "#FFD23F", "swatch-terra"],
              ["Tomato", "#FF5A36", "swatch-sand"],
              ["Mint", "#3DDC97", "swatch-moss"],
            ].map(([name, hex, cls]) => (
              <div className="swatch" key={name}>
                <div className={cls} />
                <strong>{name}</strong>
                <span>{hex}</span>
              </div>
            ))}
          </div>
        </GuideSection>

        <GuideSection number="02" title="Typography">
          <div className="type-list">
            <div>
              <span>Display / 72</span>
              <h1>MAKE IT BIG.</h1>
            </div>
            <div>
              <span>H1 / 56</span>
              <h2>Learn. Make. Repeat.</h2>
            </div>
            <div>
              <span>H2 / 40</span>
              <h3>Serious skills, zero suits.</h3>
            </div>
            <div>
              <span>H3 / 28</span>
              <h4>Your next thing starts here.</h4>
            </div>
            <div>
              <span>H4 / 20</span>
              <h5>Small class. Big energy.</h5>
            </div>
            <div>
              <span>Body / 16</span>
              <p>
                Independent instructors share the kind of knowledge that only
                comes from doing the work.
              </p>
            </div>
            <div>
              <span>Small / 13</span>
              <small>4h 45min · Self-paced · Lifetime access</small>
            </div>
          </div>
        </GuideSection>

        <GuideSection number="03" title="Buttons & actions">
          <div className="component-row">
            <div className="component-sample">
              <span>Primary</span>
              <button className="button button-primary">
                Explore courses <Arrow size={16} />
              </button>
            </div>
            <div className="component-sample">
              <span>Secondary</span>
              <button className="button button-secondary">
                View details <Arrow size={16} />
              </button>
            </div>
            <div className="component-sample">
              <span>Ghost</span>
              <button className="button button-ghost">
                Save for later <Heart size={17} />
              </button>
            </div>
            <div className="component-sample">
              <span>Hover</span>
              <button className="button button-primary is-hover">
                Explore courses <Arrow size={16} />
              </button>
            </div>
            <div className="component-sample">
              <span>Disabled</span>
              <button className="button button-primary" disabled>
                Explore courses
              </button>
            </div>
            <div className="component-sample">
              <span>Loading</span>
              <button className="button button-primary" disabled>
                <i className="spinner" />
                Loading…
              </button>
            </div>
          </div>
        </GuideSection>

        <GuideSection number="04" title="Form elements">
          <div className="form-grid">
            <label className="field">
              <span>Email address</span>
              <input type="email" placeholder="you@example.com" />
            </label>
            <label className="field has-error">
              <span>Email address</span>
              <input defaultValue="not-an-email" aria-invalid="true" />
              <small>Please enter a valid email address.</small>
            </label>
            <label className="field">
              <span>Course category</span>
              <select defaultValue="">
                <option value="" disabled>
                  Choose a category
                </option>
                <option>Photography</option>
                <option>Ceramics</option>
                <option>Cooking</option>
              </select>
            </label>
            <div className="toggle-sample">
              <span>Email updates</span>
              <button
                className={`toggle ${toggle ? "is-on" : ""}`}
                onClick={() => setToggle(!toggle)}
                role="switch"
                aria-checked={toggle}
              >
                <i />
              </button>
              <small>{toggle ? "On" : "Off"}</small>
            </div>
            <div className="component-sample">
              <span>Skill tag</span>
              <button
                className={`skill-chip ${tag ? "selected" : ""}`}
                onClick={() => setTag(!tag)}
              >
                {tag && <Check size={14} />} Photography
              </button>
            </div>
            <div className="progress-sample">
              <span>Course progress</span>
              <div className="progress-label">
                <strong>7 of 12 lessons</strong>
                <small>58%</small>
              </div>
              <div className="progress-track">
                <i style={{ width: "58%" }} />
              </div>
            </div>
          </div>
          {toast && (
            <div className="toast">
              <span>
                <Check size={16} />
              </span>
              <div>
                <strong>Course added to your library</strong>
                <small>You can start learning whenever you’re ready.</small>
              </div>
              <button
                onClick={() => setToast(false)}
                aria-label="Dismiss notification"
              >
                <Close size={17} />
              </button>
            </div>
          )}
        </GuideSection>

        <GuideSection number="05" title="Empty state">
          <div className="empty-state">
            <div className="empty-mark">
              <span>+</span>
            </div>
            <h3>Your library is waiting.</h3>
            <p>
              Courses you purchase will live here, ready whenever curiosity
              strikes.
            </p>
            <button className="button button-secondary">
              Browse courses <Arrow size={16} />
            </button>
          </div>
        </GuideSection>

        <GuideSection number="06" title="Course card states">
          <div className="state-labels">
            <span>Default / Buy</span>
            <span>Logged out</span>
            <span>Processing</span>
            <span>In progress</span>
          </div>
          <div className="course-grid guide-cards">
            <CourseCard course={{ ...courses[0], instructor: "Didier" }} />
            <CourseCard
              course={{ ...courses[1], instructor: "Didier" }}
              action="login"
            />
            <CourseCard
              course={{ ...courses[2], instructor: "Didier" }}
              action="redirect"
            />
            <CourseCard
              course={{ ...courses[3], instructor: "Didier" }}
              action="continue"
              progress={62}
            />
          </div>
        </GuideSection>
      </main>
      <div className="guide-footer">
        <Logo />
        <span>Lumen design system · Built for thoughtful learning</span>
      </div>
    </div>
  )
}

function GuideSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="guide-section">
      <div className="guide-section-title">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      <div className="guide-content">{children}</div>
    </section>
  )
}

export default function App() {
  const [view, setView] = useState(
    window.location.hash === "#style-guide" ? "guide" : "home",
  )

  useEffect(() => {
    const onHash = () =>
      setView(window.location.hash === "#style-guide" ? "guide" : "home")
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const go = (next: "home" | "guide") => {
    window.location.hash = next === "guide" ? "style-guide" : "home"
    setView(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return view === "guide" ? (
    <StyleGuide onHome={() => go("home")} />
  ) : (
    <Home onStyleGuide={() => go("guide")} />
  )
}
