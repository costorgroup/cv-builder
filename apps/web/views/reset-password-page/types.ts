export type TResetPasswordPageProps = {
  /** From the emailed link. */
  token?: string;
};

export type TResetPasswordValues = {
  password: string;
  confirmPassword: string;
};
