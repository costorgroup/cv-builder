/** Client-side checks mirroring the API's, for instant feedback. */
export const emailRules = {
  required: "Email is required",
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
};

export const newPasswordRules = {
  required: "Password is required",
  minLength: { value: 8, message: "Password must be at least 8 characters" },
  maxLength: { value: 128, message: "Password is too long" },
};

export const passwordRules = { required: "Password is required" };
