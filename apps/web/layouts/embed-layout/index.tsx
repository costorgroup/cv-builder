"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
  ThemeProvider,
  type TThemeAccent,
} from "@costor/ui";
import {
  EMBED_EVENTS,
  type TFeature,
  type TResolvedEmbedConfig,
} from "@repo/cv-core";
import { EmbedContext } from "@/layouts/embed-layout/context";
import {
  SEmbedLayout,
  SEmbedLayoutCredit,
  SEmbedLayoutMessage,
} from "@/layouts/embed-layout/styles";
import { EntitlementsContext } from "@/providers/entitlements-provider/context";
import { colorScaleOf } from "@/utils/color-scale";
import { embedApi, notifyEmbedParent, setEmbedParent } from "@/utils/embed-api";

type TEmbedState =
  | { status: "starting" }
  | { status: "ready"; config: TResolvedEmbedConfig }
  | { status: "unavailable" }
  | { status: "expired" };

/** The page showing the frame, as far as the browser tells us. */
const framingOrigin = () => {
  const ancestors = (
    window.location as Location & {
      ancestorOrigins?: DOMStringList;
    }
  ).ancestorOrigins;
  if (ancestors?.length) return ancestors[0];
  try {
    return document.referrer ? new URL(document.referrer).origin : undefined;
  } catch {
    return undefined;
  }
};

const Message = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <SEmbedLayoutMessage>
    <Empty variant="surface" radius="lg">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </SEmbedLayoutMessage>
);

/**
 * The embedded builder, inside a customer's page. It starts a session from
 * a launch token, sent by the loader script (accepted only from the sites
 * the embed allows) or put in the frame's address after `#launch=`, then
 * runs with the embed's look and rules. No account, cookies or our site's
 * chrome.
 */
const EmbedLayout = ({
  publicKey,
  children,
}: {
  publicKey: string;
  children: ReactNode;
}) => {
  const [state, setState] = useState<TEmbedState>({ status: "starting" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let removeListener = () => {};

    const start = async (launchToken: string) => {
      try {
        const config = await embedApi.exchange(publicKey, launchToken);
        setState({ status: "ready", config });
        notifyEmbedParent(EMBED_EVENTS.ready);
      } catch {
        setState({ status: "expired" });
        notifyEmbedParent(EMBED_EVENTS.sessionExpired);
      }
    };

    embedApi.frames(publicKey).then(
      ({ allowedOrigins }) => {
        const parent = framingOrigin();
        if (parent && allowedOrigins.includes(parent)) setEmbedParent(parent);

        const fromHash = new URLSearchParams(window.location.hash.slice(1)).get(
          "launch",
        );
        if (fromHash) {
          // Out of the address bar and history once read.
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
          void start(fromHash);
          return;
        }
        // Otherwise the loader posts it, from an allowed page only.
        const onMessage = (event: MessageEvent) => {
          if (!allowedOrigins.includes(event.origin)) return;
          const data = event.data as { type?: string; launchToken?: unknown };
          if (data?.type !== EMBED_EVENTS.launch) return;
          if (typeof data.launchToken !== "string") return;
          setEmbedParent(event.origin);
          void start(data.launchToken);
        };
        window.addEventListener("message", onMessage);
        removeListener = () => window.removeEventListener("message", onMessage);
        // Ask the loader for it now that this is listening. Nothing secret
        // is in this message, so it goes to whichever page holds the frame;
        // the token is only accepted back from an allowed one.
        if (window.parent !== window) {
          window.parent.postMessage({ type: "cvbuilder:waiting" }, "*");
        }
      },
      () => setState({ status: "unavailable" }),
    );
    return () => removeListener();
  }, [publicKey]);

  const config = state.status === "ready" ? state.config : undefined;

  // The embed's plan, for showing what's locked: there's no account to load.
  const entitlements = useMemo(() => {
    const features = new Set<TFeature>(config?.planFeatures ?? []);
    return {
      status: "error" as const,
      can: (feature: TFeature) => features.has(feature),
      reload: () => {},
    };
  }, [config]);

  const accents = useMemo<TThemeAccent[] | undefined>(
    () =>
      config?.theme.primaryColor
        ? [
            {
              id: "embed",
              name: "Brand",
              palette: { primary: colorScaleOf(config.theme.primaryColor) },
            },
          ]
        : undefined,
    [config],
  );

  const context = useMemo(
    () => config && { publicKey, config },
    [publicKey, config],
  );

  const renderContent = () => {
    if (state.status === "unavailable") {
      return (
        <Message title="Not available">
          This CV builder isn&apos;t available right now.
        </Message>
      );
    }
    if (state.status === "expired") {
      return (
        <Message title="Your session has ended">
          Open the CV builder again from the site to keep going.
        </Message>
      );
    }
    if (!context) return <Skeleton width="100%" height="100%" aria-busy />;
    return (
      <EmbedContext.Provider value={context}>
        <EntitlementsContext.Provider value={entitlements}>
          {children}
        </EntitlementsContext.Provider>
      </EmbedContext.Provider>
    );
  };

  return (
    <ThemeProvider
      appearance={config?.theme.mode ?? "auto"}
      accents={accents}
      accent={accents ? "embed" : undefined}
      theme={
        config?.theme.radius !== undefined
          ? {
              radius: {
                sm: `${config.theme.radius / 2}px`,
                md: `${config.theme.radius}px`,
                lg: `${config.theme.radius * 1.5}px`,
              },
            }
          : undefined
      }
      storage="localStorage"
      storageKey="cvbuilder-embed-theme"
    >
      <SEmbedLayout>
        {renderContent()}
        {config?.branding.showPlatformBranding && (
          <SEmbedLayoutCredit href="/" target="_blank" rel="noreferrer">
            Made with CV Builder
          </SEmbedLayoutCredit>
        )}
      </SEmbedLayout>
    </ThemeProvider>
  );
};

export default EmbedLayout;
