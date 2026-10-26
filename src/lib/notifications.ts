// Web Audio API Synthesizer and Browser Notification Service
// Provides dual-tone airport/bank chime, Text-To-Speech announcement, and Web Notifications

export interface CallNotificationPayload {
  ticketNumber: string;
  windowNumber: 1 | 2;
  studentName?: string;
  isRecall?: boolean;
  isSeniorCitizen?: boolean;
}

/**
 * Play a high-fidelity two-tone chime (E5 -> A5) using Web Audio API.
 * Requires no external audio assets and works offline across all modern browsers.
 */
export function playQueueChime(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz) - Bell sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Note 2: A5 (880.00 Hz) - Higher chime resolving
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.22);
      gain2.gain.setValueAtTime(0.4, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.85);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
        resolve();
      }, 850);
    } catch (err) {
      console.warn('Web Audio chime not supported or blocked:', err);
      resolve();
    }
  });
}

/**
 * Text-to-Speech voice callout with spelling out ticket number for clarity.
 */
export function speakQueueCall(payload: CallNotificationPayload) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const formattedTicket = payload.ticketNumber.split('').join(' ');
    const isSenior = payload.isSeniorCitizen || payload.ticketNumber.startsWith('S-');
    const typeLabel = isSenior ? 'Senior Citizen ticket number' : 'ticket number';
    const prefix = payload.isRecall ? 'Attention please, recalling' : 'Now calling';
    const text = `${prefix} ${typeLabel} ${formattedTicket}, please proceed to Cashier Window ${payload.windowNumber}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Full audio sequence: Plays chime first, followed by clear voice announcement.
 */
export async function playFullAudioCall(payload: CallNotificationPayload) {
  await playQueueChime();
  speakQueueCall(payload);
}

/**
 * Query current browser notification permission status.
 */
export function checkNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request system notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      sendBrowserNotification({
        ticketNumber: 'SYSTEM',
        windowNumber: 1,
        studentName: 'Notifications Active',
        isRecall: false,
      }, 'St. Anthony\'s College Notifications Enabled! You will be alerted when your number is in now.');
    }
    return perm;
  } catch (e) {
    console.warn('Failed to request notification permission:', e);
    return 'denied';
  }
}

/**
 * Trigger an OS / Desktop / Mobile Browser Notification for the currently called number.
 */
export function sendBrowserNotification(
  payload: CallNotificationPayload,
  customBody?: string
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const isSenior = payload.isSeniorCitizen || payload.ticketNumber.startsWith('S-');
    const title = payload.ticketNumber === 'SYSTEM' 
      ? 'SAC Cashier Notifications Active' 
      : isSenior
        ? `SENIOR CITIZEN: Ticket ${payload.ticketNumber}`
        : `NOW IN: Ticket ${payload.ticketNumber}`;

    const body = customBody || 
      (isSenior
        ? `Senior Citizen ticket ${payload.ticketNumber} is now being called to Cashier Window ${payload.windowNumber} (Priority Lane). Please proceed promptly!`
        : `Ticket ${payload.ticketNumber} is now being called to Cashier Window ${payload.windowNumber}. Please proceed promptly!`);

    // Try standard notification first
    new Notification(title, {
      body,
      icon: '/sac-logo.png',
      badge: '/sac-logo.png',
      tag: `sac-call-${payload.ticketNumber}-${Date.now()}`,
      silent: false,
    });
  } catch {
    // If running under a ServiceWorker (e.g. mobile PWA installed on Android/iOS)
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(
          payload.ticketNumber === 'SYSTEM' 
            ? 'SAC Cashier Notifications Active' 
            : `NOW IN: Ticket ${payload.ticketNumber}`,
          {
            body: customBody || `Please proceed to Cashier Window ${payload.windowNumber}.`,
            icon: '/sac-logo.png',
            badge: '/sac-logo.png',
            tag: 'sac-queue-call',
          }
        ).catch(() => {});
      }).catch(() => {});
    }
  }
}
