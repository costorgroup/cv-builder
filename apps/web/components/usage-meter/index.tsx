import { Flex, LinearProgress, Small, Strong } from "@costor/ui";
import type { TUsageMeterProps } from "@/components/usage-meter/types";

/** How much of one limit is used: "24 MB / 100 MB" and a bar. */
export const UsageMeter = ({
  label,
  usage: { used, max },
  format = String,
  detail,
}: TUsageMeterProps) => {
  const over = max !== null && used >= max;
  return (
    <Flex direction="column" gap={2}>
      <Flex align="baseline" justify="space-between" gap={3} wrap="wrap">
        <Strong>{label}</Strong>
        <Small color={over ? "warning" : "secondary"}>
          {max === null
            ? `${format(used)} · no limit`
            : `${format(used)} / ${format(max)}`}
        </Small>
      </Flex>
      {max !== null && (
        <LinearProgress
          value={Math.min(used, max)}
          max={Math.max(max, 1)}
          color={over ? "warning" : "primary"}
          variant="subtle"
        />
      )}
      {detail && <Small color="secondary">{detail}</Small>}
    </Flex>
  );
};

export default UsageMeter;
