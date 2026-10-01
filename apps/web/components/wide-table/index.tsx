import { SWideTable } from "@/components/wide-table/styles";
import type { TWideTableProps } from "@/components/wide-table/types";

/**
 * Wraps a DataTable whose columns need room: below `minWidth` the table
 * scrolls sideways inside its card instead of squeezing or widening the page.
 */
export const WideTable = (props: TWideTableProps) => <SWideTable {...props} />;

export default WideTable;
