import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

export type TRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const storage = new AsyncLocalStorage<TRequestContext>();

/** Longest User-Agent kept; some browsers and bots send very long ones. */
const USER_AGENT_MAX_LENGTH = 512;

/**
 * Remembers who's making the current request (IP, browser) for everything
 * that runs while handling it, e.g. audit log entries.
 */
export const requestContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) =>
  storage.run(
    {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.slice(0, USER_AGENT_MAX_LENGTH),
    },
    next,
  );

/** The current request's context; empty outside a request (e.g. a job). */
export const currentRequestContext = (): TRequestContext =>
  storage.getStore() ?? {};
