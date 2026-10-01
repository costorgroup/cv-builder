import styled from "@emotion/styled";

export const SLockedFeaturesNoticeList = styled.ul`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    margin: ${theme.spacing(2)} 0 0;
    padding: 0;
    list-style: none;
  `}
`;

/** One option, after a bullet. */
export const SLockedFeaturesNoticeItem = styled.li`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};

    &::before {
      content: "";
      flex: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    & > :first-of-type {
      flex: 1;
      min-width: 0;
    }
  `}
`;
