"use client";

import { createContext, useContext } from "react";
import type { TResolvedEmbedConfig } from "@repo/cv-core";

export type TEmbedContextValue = {
  publicKey: string;
  /** The embed as it runs: clamped to the organization's plan. */
  config: TResolvedEmbedConfig;
};

export const EmbedContext = createContext<TEmbedContextValue | null>(null);

/** The running embed; only inside an EmbedLayout with a session. */
export const useEmbed = () => {
  const value = useContext(EmbedContext);
  if (!value) throw new Error("useEmbed must be used inside an EmbedLayout");
  return value;
};
