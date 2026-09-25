"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  FileIcon,
  Flex,
  Pagination,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import CvDisplay from "@/components/cv-display";
import { useAuth } from "@/providers/auth-provider";
import { CvProvider } from "@/providers/cv-provider";
import { ApiError } from "@/utils/api-client";
import { cvEditorStepPath } from "@/utils/cv-editor";
import { cvsApi } from "@/utils/cvs-api";
import { dashboardPath } from "@/utils/dashboard-path";
import {
  SDashboardPage,
  SDashboardPageCard,
  SDashboardPageCardLink,
  SDashboardPageCardText,
  SDashboardPageGrid,
  SDashboardPageThumbnail,
} from "@/views/dashboard-page/styles";
import type {
  TDashboardEmptyProps,
  TDashboardPageCvCardProps,
  TDashboardPageProps,
  TDashboardPageResult,
} from "@/views/dashboard-page/types";

const PAGE_SIZE = 12;
const NEW_CV_PATH = cvEditorStepPath();

const editedDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const CvCard = ({ cv }: TDashboardPageCvCardProps) => (
  <SDashboardPageCardLink
    href={cvEditorStepPath(cv.id)}
    aria-label={`Edit ${cv.name}`}
  >
    <SDashboardPageCard radius="lg">
      <SDashboardPageThumbnail aria-hidden>
        <CvProvider initialData={cv.data} initialAppearance={cv.appearance}>
          <CvDisplay variant="static" page={0} />
        </CvProvider>
      </SDashboardPageThumbnail>
      <SDashboardPageCardText direction="column">
        <Strong title={cv.name}>{cv.name}</Strong>
        <Small color="secondary">
          Edited {editedDate.format(new Date(cv.updatedAt))}
        </Small>
      </SDashboardPageCardText>
    </SDashboardPageCard>
  </SDashboardPageCardLink>
);

/** Stands in for a CV card while the list loads. */
const CvCardSkeleton = () => (
  <SDashboardPageCard radius="lg" aria-hidden>
    <Skeleton width="100%" height="auto" style={{ aspectRatio: "210 / 297" }} />
    <Flex direction="column" gap={1.5}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="45%" height={12} />
    </Flex>
  </SDashboardPageCard>
);

const DashboardEmpty = ({
  title,
  description,
  action,
}: TDashboardEmptyProps) => (
  <Empty variant="surface" radius="lg">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FileIcon />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {action && <EmptyContent>{action}</EmptyContent>}
  </Empty>
);

const DashboardPage = ({ search = "", page = 1 }: TDashboardPageProps) => {
  const router = useRouter();
  const auth = useAuth();
  const [result, setResult] = useState<TDashboardPageResult>();
  // Bumped by "Try again" to fetch the same page once more.
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${search}|${page}|${attempt}`;

  const signedIn = auth.status === "signed-in";

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    cvsApi
      .list({ search, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((list) => setResult({ key: requestKey, list }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          error:
            error instanceof ApiError
              ? error.message
              : "Couldn't reach the server. Try again.",
        });
      });
    return () => controller.abort();
  }, [signedIn, search, page, requestKey]);

  // Skeletons until the answer for this exact search and page is in (or
  // while a signed-out visitor is sent to sign in by the layout).
  const current = result?.key === requestKey ? result : undefined;
  const newCvButton = (
    <Button as={ButtonLink} href={NEW_CV_PATH} variant="solid" color="primary">
      New CV
    </Button>
  );

  const renderList = () => {
    if (!current) {
      return (
        <SDashboardPageGrid aria-busy>
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <CvCardSkeleton key={index} />
          ))}
        </SDashboardPageGrid>
      );
    }
    if ("error" in current) {
      return (
        <DashboardEmpty
          title="Couldn't load your CVs"
          description={current.error}
          action={
            <Button onClick={() => setAttempt((count) => count + 1)}>
              Try again
            </Button>
          }
        />
      );
    }
    const { items, pageCount } = current.list;
    if (items.length === 0) {
      return search ? (
        <DashboardEmpty
          title="No matching CVs"
          description={`No CV names contain "${search}".`}
        />
      ) : (
        <DashboardEmpty
          title="No CVs yet"
          description="Pick a template and fill in your details to make your first CV."
          action={newCvButton}
        />
      );
    }
    return (
      <>
        <SDashboardPageGrid>
          {items.map((cv) => (
            <CvCard key={cv.id} cv={cv} />
          ))}
        </SDashboardPageGrid>
        {pageCount > 1 && (
          <Flex justify="center">
            <Pagination
              count={pageCount}
              page={Math.min(page, pageCount)}
              onChange={(_, next) => router.push(dashboardPath(search, next))}
            />
          </Flex>
        )}
      </>
    );
  };

  return (
    <SDashboardPage direction="column" gap={5}>
      {renderList()}
    </SDashboardPage>
  );
};

export default DashboardPage;
