"use client";

import { Flex, Heading, Text } from "@costor/ui";
import type { TAuthMessageProps } from "@/components/auth-message/types";

/** A status screen for the auth pages, like "Check your email". */
export const AuthMessage = ({ title, children, footer }: TAuthMessageProps) => (
  <Flex direction="column" gap={4}>
    <Heading as="h1">{title}</Heading>
    {children && <Text>{children}</Text>}
    {footer && (
      <Flex direction="column" gap={2}>
        {footer}
      </Flex>
    )}
  </Flex>
);

export default AuthMessage;
