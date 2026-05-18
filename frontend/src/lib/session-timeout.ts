/**
 * Configuration options for the SessionTimeout class.
 */
export interface SessionTimeoutOptions {
  /** Total timeout duration in milliseconds before user is logged out. */
  timeoutMs: number;
  /** Duration in milliseconds before timeout to show a warning. */
  warningMs: number;
  /** Callback invoked when the session expires. */
  onTimeout: () => void;
  /** Optional callback invoked when the warning period begins. */
  onWarning?: () => void;
}

/**
 * Monitors user activity and triggers warning/timeout callbacks.
 *
 * Tracks mousemove, keydown, click, scroll, and touchstart events.
 * Resets the inactivity timer whenever one of these events fires.
 */
export class SessionTimeout {
  private timeoutMs: number;
  private warningMs: number;
  private onTimeout: () => void;
  private onWarning?: () => void;

  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private boundHandlers: Map<string, EventListener> = new Map();
  private isRunning = false;

  constructor(options: SessionTimeoutOptions) {
    this.timeoutMs = options.timeoutMs;
    this.warningMs = options.warningMs;
    this.onTimeout = options.onTimeout;
    this.onWarning = options.onWarning;
  }

  /**
   * Registers activity event listeners and starts the inactivity timer.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

    for (const event of events) {
      const handler = () => this.reset();
      this.boundHandlers.set(event, handler);
      document.addEventListener(event, handler, { passive: true });
    }

    this.scheduleTimers();
  }

  /**
   * Clears existing timers and restarts them from now.
   */
  reset(): void {
    this.clearTimers();
    if (this.isRunning) {
      this.scheduleTimers();
    }
  }

  /**
   * Stops monitoring, clears all timers, and removes event listeners.
   */
  stop(): void {
    this.isRunning = false;
    this.clearTimers();

    for (const [event, handler] of this.boundHandlers) {
      document.removeEventListener(event, handler);
    }
    this.boundHandlers.clear();
  }

  private scheduleTimers(): void {
    const warningDelay = this.timeoutMs - this.warningMs;

    if (warningDelay > 0) {
      this.warningTimer = setTimeout(() => {
        this.onWarning?.();
      }, warningDelay);
    }

    this.timeoutTimer = setTimeout(() => {
      this.stop();
      this.onTimeout();
    }, this.timeoutMs);
  }

  private clearTimers(): void {
    if (this.warningTimer !== null) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.timeoutTimer !== null) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}

/**
 * Default warning duration: 5 minutes.
 */
const DEFAULT_WARNING_MS = 5 * 60 * 1000;

/**
 * Default total timeout duration: 30 minutes.
 */
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * React hook that manages session timeout with a warning dialog.
 *
 * Displays a modal with a countdown when the warning period begins.
 * The user can click "Stay logged in" to reset the timer, or the
 * session will automatically expire when the countdown reaches zero.
 *
 * @param onTimeout - Callback invoked when the session expires.
 * @returns Object with `showWarning`, `countdownSeconds`, `stayLoggedIn`, `start`, `stop`
 */
export function useSessionTimeout(onTimeout: () => void) {
  let showWarning = false;
  let countdownSeconds = 0;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let sessionTimeout: SessionTimeout | null = null;

  const listeners = new Set<(show: boolean) => void>();
  const countListeners = new Set<(sec: number) => void>();

  function notifyShow(val: boolean) {
    showWarning = val;
    listeners.forEach(fn => fn(val));
  }

  function notifyCountdown(val: number) {
    countdownSeconds = val;
    countListeners.forEach(fn => fn(val));
  }

  function clearCountdown() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function startCountdown(seconds: number) {
    notifyCountdown(seconds);
    let remaining = seconds;

    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearCountdown();
        notifyShow(false);
      } else {
        notifyCountdown(remaining);
      }
    }, 1000);
  }

  function handleWarning() {
    notifyShow(true);
    startCountdown(Math.round(DEFAULT_WARNING_MS / 1000));
  }

  function handleTimeout() {
    clearCountdown();
    notifyShow(false);
    onTimeout();
  }

  function stayLoggedIn() {
    clearCountdown();
    notifyShow(false);
    sessionTimeout?.reset();
  }

  function start(options?: { timeoutMs?: number; warningMs?: number }) {
    sessionTimeout = new SessionTimeout({
      timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      warningMs: options?.warningMs ?? DEFAULT_WARNING_MS,
      onTimeout: handleTimeout,
      onWarning: handleWarning,
    });
    sessionTimeout.start();
  }

  function stop() {
    clearCountdown();
    notifyShow(false);
    sessionTimeout?.stop();
    sessionTimeout = null;
  }

  return {
    get showWarning() { return showWarning; },
    get countdownSeconds() { return countdownSeconds; },
    onShowChange: (fn: (show: boolean) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    onCountdownChange: (fn: (sec: number) => void) => {
      countListeners.add(fn);
      return () => countListeners.delete(fn);
    },
    stayLoggedIn,
    start,
    stop,
  };
}
