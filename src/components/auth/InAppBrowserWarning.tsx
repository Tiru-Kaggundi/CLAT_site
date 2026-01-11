"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";
import { isInAppBrowser, getInAppBrowserName } from "@/lib/utils/browser-detection";

export function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);
  const [browserName, setBrowserName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isInAppBrowser()) {
      setIsInApp(true);
      setBrowserName(getInAppBrowserName());
    }
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleOpenInBrowser = () => {
    // Try to open in default browser (works on some platforms)
    window.open(window.location.href, "_blank");
  };

  if (!isInApp) return null;

  return (
    <Card className="mb-6 border-destructive bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-destructive mb-1">Google Sign-In Not Available</h3>
              <p className="text-sm text-muted-foreground">
                You're using {browserName || "an in-app browser"}, which doesn't support Google Sign-In for security reasons.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">To sign in, please:</p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                <li>Copy the link below</li>
                <li>Open it in your regular browser (Chrome, Safari, Firefox, etc.)</li>
                <li>Sign in with Google there</li>
              </ol>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInBrowser}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Try Opening in Browser
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              💡 <strong>Alternative:</strong> Use Email/Password login below, which works in all browsers.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
