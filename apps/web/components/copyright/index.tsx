import { Small } from "@costor/ui";
import { SCopyright } from "@/components/copyright/styles";
import { SITE_NAME } from "@/utils/site";

/** The copyright line at the bottom of the dashboard's side nav. */
export const Copyright = () => (
  <SCopyright>
    <Small color="secondary">
      © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
    </Small>
  </SCopyright>
);

export default Copyright;
