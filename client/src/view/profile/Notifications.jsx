import { Link } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";
import {
  useMarkNotificationsReadMutation,
  useNotificationsInfiniteQuery,
  useUnreadNotificationsQuery,
} from "@api/modules/notificationApi";

const timeFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// What happened on the seller's courses: new reviews and comments, newest first. Unread ones are marked until the
// seller presses "Mark all as read" (the badge in the header follows).
export default function Notifications() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationsInfiniteQuery();
  const { data: unreadData } = useUnreadNotificationsQuery();
  const [markAllRead, { isLoading: marking }] = useMarkNotificationsReadMutation();
  const items = (data?.pages ?? []).flatMap((page) => page.notifications);
  const unread = unreadData?.unread ?? 0;

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">Notifications</span>
        <h1>What&apos;s new on your courses</h1>
        <p>New reviews and comments from your students.</p>
      </header>

      <div className="profile-section-head">
        <span className="stat-label">{unread ? `${unread} unread` : "All caught up"}</span>
        {unread > 0 && (
          <button type="button" className="button button-secondary button-small" onClick={() => markAllRead()} disabled={marking}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="panel">
        {isLoading && (
          <div className="page-inline-loader" role="status" aria-label="Loading notifications">
            <span className="spinner" aria-hidden="true" />
          </div>
        )}
        {isError && (
          <div role="alert">
            <p>Couldn&apos;t load your notifications.</p>
            <button type="button" className="button button-secondary button-small" onClick={refetch}>
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <p className="review-empty">Nothing yet. When students review or comment on your courses, you&apos;ll see it here.</p>
        )}

        {items.length > 0 && (
          <ul className="notification-list">
            {items.map((n) => (
              <li key={n.id} className={`notification ${n.read ? "" : "is-unread"}`}>
                <span className="stat-icon" aria-hidden="true">
                  {n.type === "review" ? <Star size={16} /> : <MessageSquare size={16} />}
                </span>
                <div>
                  <p>
                    <strong>{n.actor}</strong>{" "}
                    {n.type === "review" ? (
                      <>
                        rated{" "}
                        <Link to={`/courses/${n.course_id}`} className="text-link">
                          {n.course_title}
                        </Link>
                        {n.rating ? ` ${n.rating} out of 5` : ""}
                      </>
                    ) : (
                      <>
                        commented on{" "}
                        <Link to={`/courses/${n.course_id}/watch`} className="text-link">
                          {n.course_title}
                        </Link>
                      </>
                    )}
                    {!n.read && <span className="visually-hidden"> (unread)</span>}
                  </p>
                  <time dateTime={n.created_at}>{timeFormat.format(new Date(n.created_at))}</time>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <button type="button" className="button button-secondary button-small" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading…" : "Show older"}
          </button>
        )}
      </div>
    </main>
  );
}
