"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Button, Link, Small } from "@costor/ui";
import AuthMessage from "@/components/auth-message";
import { ApiError, authApi } from "@/utils/auth-api";
import type {
  TResendState,
  TVerifyAccountPageProps,
  TVerifyAccountState,
} from "@/views/verify-account-page/types";

const RESEND_MESSAGES: Partial<Record<TResendState, string>> = {
  sent: "Sent. Check your inbox.",
  "signed-out": "Sign in first to get a new link.",
  error: "Couldn't send the email. Try again.",
};

/** "Check your email", with a button to send the link again. */
const CheckEmail = () => {
  const [resend, setResend] = useState<TResendState>("idle");

  const onResend = async () => {
    setResend("sending");
    try {
      await authApi.resendVerification();
      setResend("sent");
    } catch (error) {
      setResend(
        error instanceof ApiError && error.status === 401
          ? "signed-out"
          : "error",
      );
    }
  };

  return (
    <AuthMessage
      title="Check your email"
      footer={
        <>
          <Button
            variant="subtle"
            color="primary"
            fullWidth
            disabled={resend === "sending" || resend === "sent"}
            onClick={onResend}
          >
            Send the link again
          </Button>
          {RESEND_MESSAGES[resend] && <Small>{RESEND_MESSAGES[resend]}</Small>}
          <Link as={NextLink} href="/dashboard">
            Continue for now
          </Link>
        </>
      }
    >
      We sent you a link to verify your account. It works for 24 hours.
    </AuthMessage>
  );
};

const VerifyToken = ({ token }: { token: string }) => {
  const [state, setState] = useState<TVerifyAccountState>({
    status: "verifying",
  });
  // The token is single-use, so don't send it twice (e.g. in Strict Mode).
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    authApi
      .verifyAccount(token)
      .then(() => setState({ status: "verified" }))
      .catch((error: unknown) =>
        setState({
          status: "failed",
          message:
            error instanceof ApiError
              ? error.message
              : "Couldn't reach the server. Try again.",
        }),
      );
  }, [token]);

  if (state.status === "verifying") {
    return <AuthMessage title="Verifying your account…" />;
  }
  if (state.status === "verified") {
    return (
      <AuthMessage
        title="Account verified"
        footer={
          <Link as={NextLink} href="/dashboard">
            Continue
          </Link>
        }
      >
        Thanks for confirming your email.
      </AuthMessage>
    );
  }
  return (
    <AuthMessage
      title="Couldn't verify your account"
      footer={
        <Link as={NextLink} href="/auth/verify-account">
          Get a new link
        </Link>
      }
    >
      {state.message}
    </AuthMessage>
  );
};

const VerifyAccountPage = ({ token }: TVerifyAccountPageProps) =>
  token ? <VerifyToken token={token} /> : <CheckEmail />;

export default VerifyAccountPage;
