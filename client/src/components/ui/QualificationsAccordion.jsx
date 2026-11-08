import { useState } from "react";
import { Award, GraduationCap, FileText, ScrollText, Link2, ChevronDown } from "lucide-react";
import { ensureHttp } from "@utils/url";

const ICONS = [Award, GraduationCap, FileText, ScrollText];

const prettyDate = (iso) => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
  } catch {
    return iso; // an unparseable date is still better shown as stored than hidden
  }
};

const QualificationsAccordion = ({ items = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  if (!items?.length) return <p className="panel-note">No qualifications yet.</p>;

  return (
    <div className="qualifications">
      {items.map((q, index) => {
        const Icon = ICONS[index % ICONS.length];
        const isOpen = openIndex === index;
        const headId = `qualification-head-${index}`;
        const panelId = `qualification-panel-${index}`;

        return (
          <div key={index} className="qualification">
            <button
              type="button"
              id={headId}
              className="qualification-head"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
            >
              <span className="stat-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="qualification-summary">
                <strong>{q?.title || "Untitled"}</strong>
                {q?.institution && <small>{q.institution}</small>}
              </span>
              <ChevronDown size={18} className="qualification-chevron" aria-hidden="true" />
            </button>

            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={headId} className="qualification-panel">
                {q?.description && <p>{q.description}</p>}
                {q?.issued_at && (
                  <p>
                    <span className="stat-label">Issued</span> {prettyDate(q.issued_at)}
                  </p>
                )}
                {q?.certificate_url && (
                  <a href={ensureHttp(q.certificate_url)} target="_blank" rel="noreferrer" className="text-link">
                    <Link2 size={16} aria-hidden="true" /> View certificate
                  </a>
                )}
                {!q?.description && !q?.issued_at && !q?.certificate_url && <p>No further details.</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QualificationsAccordion;
