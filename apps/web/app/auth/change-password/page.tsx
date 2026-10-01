import { redirect } from "next/navigation";
import { SECURITY_PATH } from "@/utils/dashboard-path";

/** Changing the password moved to the dashboard's Security page. */
export default () => redirect(SECURITY_PATH);
