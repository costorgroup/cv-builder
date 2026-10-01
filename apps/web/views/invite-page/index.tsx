"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Link, Skeleton, Small } from "@costor/ui";
import AuthMessage from "@/components/auth-message";
import ButtonLink from "@/components/button-link";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/utils/api-client";
import { signInPath } from "@/utils/auth-routes";
import { DASHBOARD_PATH } from "@/utils/dashboard-path";
import { invitePath, teamPath } from "@/utils/team-path";
import { TEAM_ROLE_LABELS } from "@/utils/team-roles";
import { invitesApi, type TInvitePreview } from "@/utils/teams-api";
import type { TInvitePageProps } from "@/views/invite-page/types";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/** "Join Acme", and what to do: accept, sign in, or switch accounts. */
const Invite = ({ token }: TInvitePageProps) => {
  const auth = useAuth();
  const router = useRouter();
  const [invite, setInvite] = useState<TInvitePreview | { error: string }>();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    invitesApi.preview(token, controller.signal).then(setInvite, (caught) => {
      if (!controller.signal.aborted) setInvite({ error: messageOf(caught) });
    });
    return () => controller.abort();
  }, [token]);

  if (!invite || auth.status === "loading") {
    return <Skeleton width="100%" height={200} aria-busy />;
  }
  if ("error" in invite) {
    return (
      <AuthMessage
        title="This invite doesn't work"
        footer={
          <Link as={NextLink} href={DASHBOARD_PATH}>
            Go to your dashboard
          </Link>
        }
      >
        {invite.error}
      </AuthMessage>
    );
  }

  const title = `Join ${invite.teamName}`;
  const about = `${invite.invitedBy ?? "Someone"} invited ${invite.email} to join as ${TEAM_ROLE_LABELS[invite.role].toLowerCase()}.`;

  if (auth.status === "signed-out") {
    return (
      <AuthMessage
        title={title}
        footer={
          <>
            <Button
              as={ButtonLink}
              href={signInPath(invitePath(token))}
              variant="solid"
              color="primary"
              fullWidth
            >
              Sign in to accept
            </Button>
            <Small>
              No account yet?{" "}
              <Link as={NextLink} href="/auth/sign-up">
                Sign up with {invite.email}
              </Link>
              , then open this link again.
            </Small>
          </>
        }
      >
        {about}
      </AuthMessage>
    );
  }

  if (auth.user.email.toLowerCase() !== invite.email) {
    return (
      <AuthMessage
        title={title}
        footer={
          <Link as={NextLink} href="/auth/sign-out">
            Sign out
          </Link>
        }
      >
        {about} You&apos;re signed in as {auth.user.email}. Sign out, then sign
        in with {invite.email} to accept.
      </AuthMessage>
    );
  }

  const onAccept = async () => {
    setAccepting(true);
    setError(undefined);
    try {
      const team = await invitesApi.accept(token);
      router.replace(teamPath(team.slug));
    } catch (caught) {
      setError(messageOf(caught));
      setAccepting(false);
    }
  };

  return (
    <AuthMessage
      title={title}
      footer={
        <>
          {error && (
            <Alert color="error" variant="subtle" size="sm">
              {error}
            </Alert>
          )}
          <Button
            variant="solid"
            color="primary"
            fullWidth
            disabled={accepting}
            onClick={onAccept}
          >
            {accepting ? "Joining…" : "Accept and join"}
          </Button>
          <Link as={NextLink} href={DASHBOARD_PATH}>
            Not now
          </Link>
        </>
      }
    >
      {about}
    </AuthMessage>
  );
};

/** Where an invite email links to. Works signed out, to say what it's for. */
const InvitePage = ({ token }: TInvitePageProps) => (
  <AuthProvider>
    <Invite token={token} />
  </AuthProvider>
);

export default InvitePage;
