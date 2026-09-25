import styled from "@emotion/styled";
import NextLink from "next/link";

/**
 * A Next link for `<Button as={ButtonLink} href="…">`, without the link
 * underline the global styles give anchors.
 */
export const ButtonLink = styled(NextLink)`
  text-decoration: none;
`;

export default ButtonLink;
