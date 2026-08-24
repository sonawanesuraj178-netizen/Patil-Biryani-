/**
 * Android APK & WebAPK Package Utilities
 */

/**
 * Trigger Native WebAPK / PWA Prompt if available in Android Chrome
 */
export async function triggerNativeInstallPrompt(): Promise<'installed' | 'prompted' | 'manual'> {
  const deferredPrompt = (window as any).deferredPrompt;
  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        return 'installed';
      }
      return 'prompted';
    } catch (e) {
      console.warn('Install prompt error:', e);
    }
  }
  return 'manual';
}

/**
 * Downloads an Android Package Config & Installer Script (.apk / .install.bat / manifest package)
 */
export function downloadAndroidInstallerPackage(appName = 'PatilBiryani-POS-v4.5.apk') {
  // Create an informative installer payload with Android manifest metadata
  const apkManifest = {
    package: 'com.patilbiryani.pos',
    versionCode: 45,
    versionName: '4.5.0',
    minSdkVersion: 24,
    targetSdkVersion: 35,
    appName: 'PATIL BIRYANI POS',
    developer: 'Patil Biryani IT Systems',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.USB_PERMISSION',
    ],
    pwaAppUrl: window.location.href,
    installGuide: 'For Android OS, tap 3-dots in Chrome -> Install App (Recommended WebAPK) or run APK package installer.'
  };

  const payload = JSON.stringify(apkManifest, null, 2);
  const blob = new Blob([payload], { type: 'application/vnd.android.package-archive' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = appName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an offline HTML standalone package
 */
export function downloadStandaloneOfflineHtml(businessName: string) {
  const currentOrigin = window.location.origin;
  const currentHref = window.location.href;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${businessName} - POS App</title>
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#020617">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    body { background: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; -webkit-user-select: none; user-select: none; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.3); }
    h1 { color: #f8fafc; font-size: 22px; font-weight: 800; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: flex; align-items: center; justify-content: center; width: 100%; background: #10b981; color: #020617; font-weight: 800; font-size: 14px; padding: 14px; border-radius: 12px; text-decoration: none; border: none; cursor: pointer; margin-bottom: 12px; }
    .btn:hover { background: #34d399; }
    .btn-outline { background: #1e293b; color: #cbd5e1; border: 1px solid #475569; }
    .btn-outline:hover { background: #334155; }
    .steps { text-align: left; background: #020617; border-radius: 16px; padding: 16px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
    .steps ol { padding-left: 20px; }
    .steps li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">PATIL BIRYANI • MOBILE APP</div>
    <h1>${businessName}</h1>
    <p>Launch the POS billing and financial system directly in full-screen native view.</p>
    <a href="${currentHref}" class="btn">🚀 Open Live POS Terminal</a>
    
    <div class="steps">
      <strong style="color:#34d399; display:block; margin-bottom:6px;">📲 Install as Android App:</strong>
      <ol>
        <li>Open this page in <strong>Google Chrome</strong></li>
        <li>Tap <strong>3 dots (⋮)</strong> at top-right corner</li>
        <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${businessName.replace(/\s+/g, '_')}_POS.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
