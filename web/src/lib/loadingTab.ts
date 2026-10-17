/**
 * Shows a small "loading" message in a tab opened ahead of an async URL lookup, so the user sees
 * something other than a blank page while the signed link is being created.
 */
export function showLoadingInTab(tab: Window | null, message = "Opening file…") {
  if (!tab) return;
  try {
    const doc = tab.document;
    doc.title = message;
    doc.body.style.cssText =
      "margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:system-ui,sans-serif;color:#555;background:#fafafa";
    const spinner = doc.createElement("div");
    spinner.style.cssText =
      "width:36px;height:36px;border:4px solid #ddd;border-top-color:#888;border-radius:50%;animation:tmf-spin 0.8s linear infinite";
    const style = doc.createElement("style");
    style.textContent = "@keyframes tmf-spin{to{transform:rotate(360deg)}}@media (prefers-color-scheme:dark){body{background:#111!important;color:#bbb!important}}";
    const text = doc.createElement("p");
    text.textContent = message;
    text.style.cssText = "margin:0;font-size:14px";
    doc.head.appendChild(style);
    doc.body.replaceChildren(spinner, text);
  } catch {
    // Some browsers do not allow writing to the new tab; it will still navigate to the file.
  }
}
