export type TChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type TChangePasswordFormProps = {
  /** Called once the password changed (which signed other devices out). */
  onChanged: () => void;
};

export type TSessionsCardProps = {
  /** Bumped to load the list again. */
  version: number;
};
