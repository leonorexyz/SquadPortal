import { syncProjectWithGoogle } from "./sync";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const MIN_POLL_INTERVAL_MS = 1_000;

export type GoogleSyncPollingConfig = {
  projectId: string;
  userId: string;
  spreadsheetId: string;
  range?: string;
  intervalMs?: number;
};

export type GoogleSyncPollingStatus = "idle" | "running" | "success" | "error";
export type GoogleSyncPollingResult = Awaited<ReturnType<typeof syncProjectWithGoogle>>;

export type GoogleSyncPoller = {
  start: () => void;
  stop: () => void;
  poll: () => Promise<GoogleSyncPollingResult | null>;
  getStatus: () => {
    status: GoogleSyncPollingStatus;
    intervalMs: number;
    lastPolledAt: string | null;
    lastError: string | null;
    lastResult: GoogleSyncPollingResult | null;
  };
};

const activePollers = new Map<string, GoogleSyncPoller>();

function pollerKey(config: GoogleSyncPollingConfig) {
  return `${config.userId}:${config.projectId}:${config.spreadsheetId}`;
}

export function createGoogleSyncPoller(config: GoogleSyncPollingConfig): GoogleSyncPoller {
  const intervalMs = Math.max(MIN_POLL_INTERVAL_MS, Math.floor(config.intervalMs ?? DEFAULT_POLL_INTERVAL_MS));
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;
  let status: GoogleSyncPollingStatus = "idle";
  let lastPolledAt: string | null = null;
  let lastError: string | null = null;
  let lastResult: GoogleSyncPollingResult | null = null;

  const poll = async () => {
    if (inFlight) return lastResult;
    inFlight = true;
    status = "running";
    lastPolledAt = new Date().toISOString();
    try {
      const result = await syncProjectWithGoogle(config.projectId, config.userId, {
        action: "sync",
        spreadsheetId: config.spreadsheetId,
        range: config.range ?? "Tasks!A1:G",
        dryRun: false,
      });
      lastResult = result;
      lastError = null;
      status = "success";
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Google sync failed";
      status = "error";
      return null;
    } finally {
      inFlight = false;
    }
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(() => void poll(), intervalMs);
    void poll();
  };

  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    if (status === "running") status = "idle";
  };

  return {
    start,
    stop,
    poll,
    getStatus: () => ({ status, intervalMs, lastPolledAt, lastError, lastResult }),
  };
}

export function startGoogleSyncPolling(config: GoogleSyncPollingConfig) {
  const key = pollerKey(config);
  activePollers.get(key)?.stop();
  const poller = createGoogleSyncPoller(config);
  activePollers.set(key, poller);
  poller.start();
  return poller;
}

export function stopGoogleSyncPolling(config: Pick<GoogleSyncPollingConfig, "projectId" | "userId" | "spreadsheetId">) {
  const key = pollerKey(config);
  const poller = activePollers.get(key);
  if (!poller) return false;
  poller.stop();
  activePollers.delete(key);
  return true;
}
