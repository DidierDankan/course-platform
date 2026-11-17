import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import { NOTIFICATIONS_POLL_MS, useUnreadNotificationsQuery } from "@api/modules/notificationApi";

// The header's bell for sellers and admins: polls the unread count every minute while the tab is visible, and again
// when the tab regains focus (needs setupListeners in the store). The number is in the link's accessible name.
export default function NotificationsLink({ onClick }) {
  const { data } = useUnreadNotificationsQuery(undefined, {
    pollingInterval: NOTIFICATIONS_POLL_MS,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  });
  const unread = data?.unread ?? 0;
  const label = unread ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <NavLink to="/profile/notifications" onClick={onClick} aria-label={label} className="nav-notifications">
      <Bell size={17} aria-hidden="true" />
      <span className="nav-notifications-text">Notifications</span>
      {unread > 0 && (
        <span className="nav-badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </NavLink>
  );
}
