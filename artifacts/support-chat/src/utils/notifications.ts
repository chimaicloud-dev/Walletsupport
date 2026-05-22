export function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
  }
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/bot-avatar.svg", silent: true });
    } catch {
    }
  }
}

export async function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function getVisitorName(): string {
  const key = "support_visitor_name";
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = Math.random().toString(36).substring(2, 6).toUpperCase();
  const name = `Visitor ${id}`;
  localStorage.setItem(key, name);
  return name;
}
