(function () {
  if (typeof EventSource === 'undefined') return;

  const script = document.querySelector('script[data-since]');
  const cursor = Number(script?.dataset.since || 0);
  const badge = document.getElementById('notificationBadge');
  const source = new EventSource(`/notifications/stream?since=${encodeURIComponent(cursor)}`);
  let unreadCount = Number(badge?.textContent || 0);

  source.addEventListener('notification', (event) => {
    let notification;
    try {
      notification = JSON.parse(event.data);
    } catch {
      return;
    }

    unreadCount += 1;
    if (badge) {
      badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      badge.style.display = 'inline-flex';
    }

    const toast = document.createElement('a');
    toast.className = 'toast notification-toast';
    toast.href = `/notifications/${encodeURIComponent(notification.notification_id)}/open`;
    toast.setAttribute('role', 'status');
    toast.textContent = notification.message || 'มีการแจ้งเตือนใหม่';
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 8000);
  });
})();
