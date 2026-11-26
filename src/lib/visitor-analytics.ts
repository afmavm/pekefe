import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "visitor_analytics_db.json");

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes for "Anlık" live visitors
const PAGEVIEW_DEDUP_MS = 3000; // Prevent double-counting on rapid re-renders
const MAX_DAILY_RETENTION_DAYS = 400; // Keep > 1 full year of exact daily buckets

const BOT_USER_AGENT_REGEX =
  /bot|crawler|spider|slurp|mediapartners|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|telegrambot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic-ai|ccbot|lighthouse|headlesschrome|phantomjs|selenium|puppeteer|playwright|curl|wget|python-requests|httpclient|axios|go-http-client|uptime|pingdom|statuscake/i;

export type TrafficSourceName =
  | "Google Ads"
  | "Google Organik"
  | "Instagram"
  | "Facebook"
  | "WhatsApp"
  | "YouTube"
  | "Doğrudan"
  | "Diğer";

export interface ActiveSession {
  lastSeen: number;
  lastPageviewAt?: number;
  path: string;
  device: "mobile" | "desktop";
  source?: TrafficSourceName;
}

export interface DailyVisitorBucket {
  date: string; // YYYY-MM-DD (Europe/Istanbul)
  visitors: string[]; // unique anonymized visitor hashes
  pageviews: number;
  mobile: number;
  desktop: number;
  pages?: Record<string, number>;
  sources?: Record<string, number>;
}

interface VisitorAnalyticsStore {
  version: number;
  startedAt: string;
  updatedAt: string;
  activeSessions: Record<string, ActiveSession>;
  daily: Record<string, DailyVisitorBucket>;
}

export interface VisitorStatsSummary {
  realtime: {
    activeVisitors: number;
    mobile: number;
    desktop: number;
    activePages: Array<{ path: string; count: number }>;
  };
  daily: {
    date: string;
    uniqueVisitors: number;
    pageviews: number;
    yesterdayVisitors: number;
    changePercent: number | null;
  };
  weekly: {
    uniqueVisitors: number;
    pageviews: number;
    dailyAverage: number;
    trend: Array<{
      date: string;
      label: string;
      visitors: number;
      pageviews: number;
    }>;
  };
  yearly: {
    year: number;
    uniqueVisitors: number;
    pageviews: number;
    dailyAverage: number;
  };
  devices: {
    mobile: number;
    desktop: number;
    mobilePercent: number;
    desktopPercent: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    percent: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percent: number;
  }>;
  startedAt: string;
  updatedAt: string;
}

let memoryCache: { store: VisitorAnalyticsStore; loadedAt: number } | null = null;
const CACHE_TTL_MS = 2000;

export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return true;
  return BOT_USER_AGENT_REGEX.test(userAgent);
}

export function detectDevice(userAgent?: string | null): "mobile" | "desktop" {
  if (!userAgent) return "desktop";
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent)
    ? "mobile"
    : "desktop";
}

export function classifyTrafficSource(
  referrer?: string | null,
  search?: string | null
): TrafficSourceName {
  const qs = typeof search === "string" ? search.trim() : "";
  const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);

  const gclid = params.get("gclid") || params.get("gbraid") || params.get("wbraid") || params.get("gad_source");
  const fbclid = params.get("fbclid");
  const utmSource = (params.get("utm_source") || "").toLowerCase();
  const utmMedium = (params.get("utm_medium") || "").toLowerCase();

  // 1. Paid Google Ads detection
  if (
    gclid ||
    (utmSource.includes("google") &&
      (utmMedium.includes("cpc") ||
        utmMedium.includes("ppc") ||
        utmMedium.includes("paid") ||
        utmMedium.includes("ads")))
  ) {
    return "Google Ads";
  }

  // 2. Explicit UTM sources
  if (utmSource.includes("instagram") || utmSource === "ig") return "Instagram";
  if (utmSource.includes("facebook") || utmSource === "fb") return "Facebook";
  if (utmSource.includes("whatsapp") || utmSource === "wa") return "WhatsApp";
  if (utmSource.includes("youtube") || utmSource === "yt") return "YouTube";
  if (utmSource.includes("google")) return "Google Organik";

  // 3. Facebook click ID fallback
  if (fbclid) return "Facebook";

  // 4. Referrer hostname classification
  if (referrer && typeof referrer === "string" && referrer.trim()) {
    try {
      const host = new URL(referrer.trim()).hostname.toLowerCase();
      if (host.includes("pekefe.com") || host === "localhost" || host === "127.0.0.1") {
        return "Doğrudan";
      }
      if (host.includes("instagram.com") || host.includes("l.instagram.com")) return "Instagram";
      if (host.includes("facebook.com") || host.includes("fb.com") || host.includes("m.facebook.com") || host.includes("l.facebook.com")) {
        return "Facebook";
      }
      if (host.includes("whatsapp.com") || host.includes("wa.me")) return "WhatsApp";
      if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
      if (host.includes("google.") || host.includes("googleapis.com") || host.includes("googleadservices.com")) {
        return host.includes("googleadservices.com") ? "Google Ads" : "Google Organik";
      }
      return "Diğer";
    } catch {
      return "Diğer";
    }
  }

  return "Doğrudan";
}

export function getIstanbulDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const tr = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return tr.toISOString().slice(0, 10);
  }
}

function getIstanbulDayLabel(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      timeZone: "Europe/Istanbul",
    }).format(dt);
  } catch {
    return dateStr.slice(5);
  }
}

function getPastIstanbulDates(count: number, now: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(getIstanbulDateString(d));
  }
  return dates;
}

function createEmptyStore(): VisitorAnalyticsStore {
  const nowIso = new Date().toISOString();
  return {
    version: 2,
    startedAt: nowIso,
    updatedAt: nowIso,
    activeSessions: {},
    daily: {},
  };
}

function readStore(forceDisk = false): VisitorAnalyticsStore {
  const now = Date.now();
  if (!forceDisk && memoryCache && now - memoryCache.loadedAt < CACHE_TTL_MS) {
    return memoryCache.store;
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      const empty = createEmptyStore();
      memoryCache = { store: empty, loadedAt: now };
      return empty;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const store: VisitorAnalyticsStore = {
      version: parsed.version || 2,
      startedAt: parsed.startedAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      activeSessions: parsed.activeSessions && typeof parsed.activeSessions === "object" ? parsed.activeSessions : {},
      daily: parsed.daily && typeof parsed.daily === "object" ? parsed.daily : {},
    };
    memoryCache = { store, loadedAt: now };
    return store;
  } catch (err) {
    console.error("[VisitorAnalytics] Error reading store:", err);
    return memoryCache?.store || createEmptyStore();
  }
}

function writeStore(store: VisitorAnalyticsStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.updatedAt = new Date().toISOString();
    const payload = JSON.stringify(store);
    const tmpPath = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, payload, "utf8");
    try {
      fs.renameSync(tmpPath, DB_PATH);
    } catch {
      fs.writeFileSync(DB_PATH, payload, "utf8");
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup error
      }
    }
    memoryCache = { store, loadedAt: Date.now() };
  } catch (err) {
    console.error("[VisitorAnalytics] Error writing store:", err);
  }
}

function pruneStore(store: VisitorAnalyticsStore, nowMs: number): void {
  const cutoff = nowMs - ACTIVE_WINDOW_MS;
  for (const [vid, session] of Object.entries(store.activeSessions)) {
    if (!session || typeof session.lastSeen !== "number" || session.lastSeen < cutoff) {
      delete store.activeSessions[vid];
    }
  }

  const keys = Object.keys(store.daily);
  if (keys.length > MAX_DAILY_RETENTION_DAYS) {
    keys.sort();
    const removeCount = keys.length - MAX_DAILY_RETENTION_DAYS;
    for (let i = 0; i < removeCount; i++) {
      delete store.daily[keys[i]];
    }
  }
}

export function normalizeVisitorHash(rawVisitorId: string | null | undefined, ip: string, userAgent: string): string {
  const cleanClientId =
    typeof rawVisitorId === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(rawVisitorId.trim())
      ? rawVisitorId.trim()
      : null;

  const base = cleanClientId ? `cid:${cleanClientId}` : `ipua:${ip}|${userAgent}`;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 16);
}

export function sanitizePath(rawPath?: string | null): string {
  if (!rawPath || typeof rawPath !== "string") return "/";
  const trimmed = rawPath.trim().split("?")[0].split("#")[0];
  if (!trimmed.startsWith("/")) return "/";
  return trimmed.slice(0, 160) || "/";
}

export function recordVisit(params: {
  visitorId?: string | null;
  ip: string;
  userAgent: string;
  path: string;
  type: "pageview" | "heartbeat";
  referrer?: string | null;
  search?: string | null;
  isSessionEntry?: boolean;
}): { recorded: boolean } {
  if (isBotUserAgent(params.userAgent)) {
    return { recorded: false };
  }

  const cleanPath = sanitizePath(params.path);
  if (
    cleanPath.startsWith("/admin") ||
    cleanPath.startsWith("/api") ||
    cleanPath.startsWith("/_next")
  ) {
    return { recorded: false };
  }

  const now = new Date();
  const nowMs = now.getTime();
  const todayStr = getIstanbulDateString(now);
  const visitorHash = normalizeVisitorHash(params.visitorId, params.ip, params.userAgent);
  const device = detectDevice(params.userAgent);

  const store = readStore(true);
  pruneStore(store, nowMs);

  const prevSession = store.activeSessions[visitorHash];
  const isDuplicatePageview =
    params.type === "pageview" &&
    prevSession &&
    prevSession.path === cleanPath &&
    typeof prevSession.lastPageviewAt === "number" &&
    nowMs - prevSession.lastPageviewAt < PAGEVIEW_DEDUP_MS;

  const shouldCountPageview = params.type === "pageview" && !isDuplicatePageview;

  let detectedSource: TrafficSourceName | undefined = prevSession?.source;
  const shouldAttributeSource =
    params.type === "pageview" &&
    !isDuplicatePageview &&
    (params.isSessionEntry === true || !prevSession);

  if (shouldAttributeSource) {
    detectedSource = classifyTrafficSource(params.referrer, params.search);
  }

  store.activeSessions[visitorHash] = {
    lastSeen: nowMs,
    lastPageviewAt: shouldCountPageview ? nowMs : prevSession?.lastPageviewAt,
    path: cleanPath,
    device,
    source: detectedSource,
  };

  if (!store.daily[todayStr]) {
    store.daily[todayStr] = {
      date: todayStr,
      visitors: [],
      pageviews: 0,
      mobile: 0,
      desktop: 0,
      pages: {},
      sources: {},
    };
  }

  const bucket = store.daily[todayStr];
  if (!bucket.pages) bucket.pages = {};
  if (!bucket.sources) bucket.sources = {};

  const isNewDailyVisitor = !bucket.visitors.includes(visitorHash);
  if (isNewDailyVisitor) {
    bucket.visitors.push(visitorHash);
    if (device === "mobile") {
      bucket.mobile += 1;
    } else {
      bucket.desktop += 1;
    }
  }

  if (shouldCountPageview) {
    bucket.pageviews += 1;
    bucket.pages[cleanPath] = (bucket.pages[cleanPath] || 0) + 1;
  }

  if (shouldAttributeSource && detectedSource) {
    bucket.sources[detectedSource] = (bucket.sources[detectedSource] || 0) + 1;
  }

  writeStore(store);
  return { recorded: true };
}

export function getVisitorStats(): VisitorStatsSummary {
  const now = new Date();
  const nowMs = now.getTime();
  const store = readStore(true);

  const cutoff = nowMs - ACTIVE_WINDOW_MS;
  const activeEntries = Object.values(store.activeSessions).filter(
    (s) => s && typeof s.lastSeen === "number" && s.lastSeen >= cutoff
  );

  let realtimeMobile = 0;
  let realtimeDesktop = 0;
  const pageCounts: Record<string, number> = {};

  for (const s of activeEntries) {
    if (s.device === "mobile") realtimeMobile += 1;
    else realtimeDesktop += 1;
    const p = s.path || "/";
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  }

  const activePages = Object.entries(pageCounts)
    .map(([pagePath, count]) => ({ path: pagePath, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily (Today & Yesterday in Europe/Istanbul)
  const last7Dates = getPastIstanbulDates(7, now);
  const todayStr = last7Dates[last7Dates.length - 1];
  const yesterdayStr = last7Dates[last7Dates.length - 2];

  const todayBucket = store.daily[todayStr];
  const yesterdayBucket = store.daily[yesterdayStr];

  const dailyUnique = todayBucket ? todayBucket.visitors.length : 0;
  const dailyPageviews = todayBucket ? todayBucket.pageviews : 0;
  const yesterdayUnique = yesterdayBucket ? yesterdayBucket.visitors.length : 0;

  let changePercent: number | null = null;
  if (yesterdayUnique > 0) {
    changePercent = Math.round(((dailyUnique - yesterdayUnique) / yesterdayUnique) * 100);
  }

  // Weekly (Last 7 calendar days unique union + pageviews + top pages + traffic sources)
  const weeklyVisitorSet = new Set<string>();
  let weeklyPageviews = 0;
  let weeklyMobile = 0;
  let weeklyDesktop = 0;
  let weeklyActiveDays = 0;
  const weeklyPageMap: Record<string, number> = {};
  const weeklySourceMap: Record<string, number> = {};

  const weeklyTrend = last7Dates.map((dateStr) => {
    const b = store.daily[dateStr];
    if (b) {
      if (b.visitors.length > 0 || b.pageviews > 0) {
        weeklyActiveDays += 1;
      }
      for (const vid of b.visitors) weeklyVisitorSet.add(vid);
      weeklyPageviews += b.pageviews || 0;
      weeklyMobile += b.mobile || 0;
      weeklyDesktop += b.desktop || 0;

      if (b.pages) {
        for (const [p, count] of Object.entries(b.pages)) {
          weeklyPageMap[p] = (weeklyPageMap[p] || 0) + Number(count || 0);
        }
      }
      if (b.sources) {
        for (const [src, count] of Object.entries(b.sources)) {
          weeklySourceMap[src] = (weeklySourceMap[src] || 0) + Number(count || 0);
        }
      }
    }
    return {
      date: dateStr,
      label: getIstanbulDayLabel(dateStr),
      visitors: b ? b.visitors.length : 0,
      pageviews: b ? b.pageviews : 0,
    };
  });

  const weeklyUnique = weeklyVisitorSet.size;
  const weeklyDailyAverage = weeklyActiveDays > 0 ? Math.round(weeklyUnique / weeklyActiveDays) : 0;

  // Top Pages (Last 7 Days)
  const totalTrackedPageviews = Object.values(weeklyPageMap).reduce((s, v) => s + v, 0);
  const topPages = Object.entries(weeklyPageMap)
    .map(([pagePath, views]) => ({
      path: pagePath,
      views,
      percent: totalTrackedPageviews > 0 ? Math.round((views / totalTrackedPageviews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  // Traffic Sources (Last 7 Days)
  const totalSourceVisits = Object.values(weeklySourceMap).reduce((s, v) => s + v, 0);
  const trafficSources = Object.entries(weeklySourceMap)
    .map(([source, visits]) => ({
      source,
      visits,
      percent: totalSourceVisits > 0 ? Math.round((visits / totalSourceVisits) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  // Yearly (Current Istanbul calendar year YYYY)
  const currentYear = Number(todayStr.slice(0, 4));
  const yearPrefix = `${currentYear}-`;
  const yearlyVisitorSet = new Set<string>();
  let yearlyPageviews = 0;
  let activeDaysInYear = 0;

  for (const [dateStr, b] of Object.entries(store.daily)) {
    if (!dateStr.startsWith(yearPrefix) || !b) continue;
    if (b.visitors.length > 0 || b.pageviews > 0) {
      activeDaysInYear += 1;
    }
    for (const vid of b.visitors) yearlyVisitorSet.add(vid);
    yearlyPageviews += b.pageviews || 0;
  }

  const yearlyUnique = yearlyVisitorSet.size;
  const dailyAverage = activeDaysInYear > 0 ? Math.round(yearlyUnique / activeDaysInYear) : 0;

  const totalDevices = weeklyMobile + weeklyDesktop;
  const mobilePercent = totalDevices > 0 ? Math.round((weeklyMobile / totalDevices) * 100) : 0;
  const desktopPercent = totalDevices > 0 ? 100 - mobilePercent : 0;

  return {
    realtime: {
      activeVisitors: activeEntries.length,
      mobile: realtimeMobile,
      desktop: realtimeDesktop,
      activePages,
    },
    daily: {
      date: todayStr,
      uniqueVisitors: dailyUnique,
      pageviews: dailyPageviews,
      yesterdayVisitors: yesterdayUnique,
      changePercent,
    },
    weekly: {
      uniqueVisitors: weeklyUnique,
      pageviews: weeklyPageviews,
      dailyAverage: weeklyDailyAverage,
      trend: weeklyTrend,
    },
    yearly: {
      year: currentYear,
      uniqueVisitors: yearlyUnique,
      pageviews: yearlyPageviews,
      dailyAverage,
    },
    devices: {
      mobile: weeklyMobile,
      desktop: weeklyDesktop,
      mobilePercent,
      desktopPercent,
    },
    topPages,
    trafficSources,
    startedAt: store.startedAt,
    updatedAt: store.updatedAt,
  };
}
