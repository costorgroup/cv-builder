/*
 * CV Builder embed loader, v1.
 *
 *   <div id="cv-builder"></div>
 *   <script src="https://<cv-builder host>/embed/v1/cv-builder.js"></script>
 *   <script>
 *     const builder = CvBuilder.mount("#cv-builder", {
 *       publicKey: "pk_…",
 *       launchToken: "…", // from POST /v1/embed/sessions, on your server
 *       onEvent: (type, detail) => {
 *         // "ready", "saved" ({ id, name }) or "session-expired":
 *         // get a new launch token and call builder.relaunch(token).
 *       },
 *     });
 *   </script>
 *
 * The launch token is handed to the builder's frame only, by postMessage to
 * its own origin; it never goes in an address or to another page.
 */
(() => {
  "use strict";

  const script = document.currentScript;
  const ORIGIN = script ? new URL(script.src).origin : window.location.origin;
  const PREFIX = "cvbuilder:";

  const mount = (target, options) => {
    const container =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw new Error(`CvBuilder: no element for ${target}`);
    if (!options || !/^pk_[0-9a-f]{24}$/.test(options.publicKey || "")) {
      throw new Error("CvBuilder: a publicKey like pk_… is required");
    }

    let launchToken = options.launchToken;
    const onEvent =
      typeof options.onEvent === "function" ? options.onEvent : null;
    const src = `${ORIGIN}/embed/${options.publicKey}`;

    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = options.title || "CV builder";
    frame.allow = "clipboard-write";
    frame.style.width = "100%";
    frame.style.height = options.height || "820px";
    frame.style.border = "0";
    frame.style.display = "block";

    const sendLaunch = () => {
      if (!launchToken || !frame.contentWindow) return;
      frame.contentWindow.postMessage(
        { type: `${PREFIX}launch`, launchToken },
        ORIGIN,
      );
      // Single use: it's not sent twice.
      launchToken = null;
    };

    const onMessage = (event) => {
      if (event.origin !== ORIGIN || event.source !== frame.contentWindow) {
        return;
      }
      const data = event.data || {};
      if (typeof data.type !== "string" || !data.type.startsWith(PREFIX)) {
        return;
      }
      const type = data.type.slice(PREFIX.length);
      if (type === "waiting") {
        sendLaunch();
        return;
      }
      if (onEvent) onEvent(type, data.detail);
    };

    // The frame asks once it's listening; sending on "load" could be too
    // early, and the token can only be used once.
    window.addEventListener("message", onMessage);
    container.appendChild(frame);

    return {
      /** Starts again with a new launch token, e.g. after it expired. */
      relaunch: (token) => {
        launchToken = token;
        frame.src = src;
      },
      /** Removes the builder from the page. */
      destroy: () => {
        window.removeEventListener("message", onMessage);
        frame.remove();
      },
      frame,
    };
  };

  window.CvBuilder = { mount, version: "1" };
})();
