import styled from "@emotion/styled";
import { Button, Flex } from "@costor/ui";

export const SAccountNav = styled(Flex)`
  height: 100%;
`;

/** Avatar + name; opens the account menu. */
export const SAccountNavTrigger = styled.button`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2.5)};
    padding: ${theme.spacing(1.5, 2.5, 1.5, 1.5)};
    border: none;
    border-radius: ${theme.radius.md};
    background-color: transparent;
    color: ${theme.palette.default.main};
    font: inherit;
    cursor: pointer;
    transition: background-color 200ms ease-in-out;

    &:hover,
    &[aria-expanded="true"] {
      background-color: ${theme.palette.primary.main}15;
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }
  `}
`;

export const SAccountNavUser = styled(Flex)`
  min-width: 0;
  max-width: 200px;
  text-align: left;

  & > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Just the avatar on narrow screens. */
  ${({ theme }) => theme.breakpoints.down("sm")} {
    display: none;
  }
`;

export const SAccountNavIcon = styled.svg`
  width: 1.25em;
  height: 1.25em;
`;

/** Hidden on narrow screens, where the site menu offers sign-in instead. */
export const SAccountNavSignIn = styled(Button)`
  ${({ theme }) => theme.breakpoints.down("sm")} {
    display: none;
  }
`;
