export type TDashboardLayoutProps = {
  children: React.ReactNode;
};

/** Heading shown in the top bar for a dashboard route. */
export type TDashboardLayoutPage = {
  title: string;
  description: string;
  /** Shows the CV search in the top bar. */
  searchable?: boolean;
};
