export type TVerifyAccountPageProps = {
  /** From the emailed link; without it the page asks to check email. */
  token?: string;
};

export type TVerifyAccountState =
  | { status: "verifying" }
  | { status: "verified" }
  | { status: "failed"; message: string };

export type TResendState = "idle" | "sending" | "sent" | "signed-out" | "error";
