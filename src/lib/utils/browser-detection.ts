/**
 * Detects if the current browser is an in-app browser (webview)
 * that may have issues with Google OAuth
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Common in-app browser indicators
  // Only matches specific in-app browser patterns, not regular browsers
  const inAppPatterns = [
    "linkedinapp", // LinkedIn in-app browser
    "fban", // Facebook App (Android)
    "fbav", // Facebook App (iOS)
    "instagram", // Instagram in-app browser
    "twitterandroid", // Twitter/X Android in-app browser
    "twitterios", // Twitter/X iOS in-app browser
    "wechat", // WeChat in-app browser
    "line", // Line in-app browser
    "wv", // Android WebView (generic indicator)
  ];

  // Check for standalone mode (PWA) - if standalone, it's not an in-app browser
  const isStandalone = (window.navigator as any).standalone === true;
  if (isStandalone) return false;

  // Check for in-app patterns
  return inAppPatterns.some((pattern) => userAgent.includes(pattern));
}

/**
 * Gets a user-friendly name for the detected in-app browser
 */
export function getInAppBrowserName(): string | null {
  if (typeof window === "undefined") return null;

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("linkedinapp")) return "LinkedIn";
  if (userAgent.includes("fban") || userAgent.includes("fbav")) return "Facebook";
  if (userAgent.includes("instagram")) return "Instagram";
  if (userAgent.includes("twitterandroid") || userAgent.includes("twitterios")) return "Twitter/X";
  if (userAgent.includes("wechat")) return "WeChat";
  if (userAgent.includes("line")) return "Line";

  return "this app";
}
