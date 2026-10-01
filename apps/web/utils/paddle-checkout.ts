"use client";

import type { TBillingConfig } from "@/utils/billing-api";

/** The bits of Paddle.js v2 used here (https://developer.paddle.com/paddlejs). */
type TPaddleEvent = { name?: string; data?: { transaction_id?: string } };
type TPaddle = {
  Environment: { set: (environment: string) => void };
  Initialize: (options: {
    token: string;
    eventCallback: (event: TPaddleEvent) => void;
  }) => void;
  Checkout: {
    open: (options: {
      transactionId: string;
      settings?: { displayMode?: "overlay"; theme?: "light" | "dark" };
    }) => void;
    close: () => void;
  };
};

declare global {
  interface Window {
    Paddle?: TPaddle;
  }
}

const SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";

/** Called when a checkout is paid; set per checkout. */
let onCompleted: ((checkoutId: string) => void) | undefined;
let onClosed: (() => void) | undefined;
let ready: Promise<TPaddle> | undefined;

/** Paddle.js, loaded and set up once, the first time a checkout opens. */
const loadPaddle = (
  config: Extract<TBillingConfig, { provider: "paddle" }>,
) => {
  ready ??= new Promise<TPaddle>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onerror = () => {
      ready = undefined;
      reject(new Error("Couldn't load the checkout. Try again."));
    };
    script.onload = () => {
      const paddle = window.Paddle;
      if (!paddle) return reject(new Error("Couldn't load the checkout."));
      if (config.environment === "sandbox") paddle.Environment.set("sandbox");
      paddle.Initialize({
        token: config.clientToken,
        eventCallback: (event) => {
          if (
            event.name === "checkout.completed" &&
            event.data?.transaction_id
          ) {
            onCompleted?.(event.data.transaction_id);
          }
          if (event.name === "checkout.closed") onClosed?.();
        },
      });
      resolve(paddle);
    };
    document.head.append(script);
  });
  return ready;
};

/**
 * Opens the provider's checkout over the page for a checkout our API
 * created. `completed` runs once it's paid; `closed` when the buyer closes
 * it (paid or not).
 */
export const openCheckout = async (
  config: TBillingConfig,
  checkoutId: string,
  handlers: { completed: (checkoutId: string) => void; closed: () => void },
  theme: "light" | "dark",
) => {
  if (config.provider !== "paddle" || !config.clientToken) {
    throw new Error("Payments aren't set up yet.");
  }
  const paddle = await loadPaddle(config);
  onCompleted = handlers.completed;
  onClosed = handlers.closed;
  paddle.Checkout.open({
    transactionId: checkoutId,
    settings: { displayMode: "overlay", theme },
  });
};

/** Closes the checkout, e.g. once the plan has been applied. */
export const closeCheckout = () => window.Paddle?.Checkout.close();
