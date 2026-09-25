"use client";

import Image from "next/image";
import { CvDisplay, CvExportModal, ThemeToggle } from "@/components";
import { CvPlaceholders, CvProvider, useCv } from "@/providers/cv-provider";
import {
  SManageCvLayout,
  SManageCvLayoutPreview,
  SManageCvLayoutCardWrapper,
  SManageCvLayoutCard,
  SManageCvLayoutCompletion,
  SManageCvLayoutNavContent,
  SManageCvLayoutNavActions,
  SManageCvLayoutBrand,
  SManageCvLayoutCardHeader,
  SManageCvLayoutCardFooter,
  SManageCvLayoutContent,
  SManageCvLayoutPreviewCenter,
  SManageCvLayoutMessage,
} from "@/layouts/manage-cv-layout/styles";
import type {
  TManageCvLayoutContentProps,
  TManageCvLayoutLoad,
  TManageCvLayoutNavItem,
  TManageCvLayoutProps,
} from "@/layouts/manage-cv-layout/types";
import ButtonLink from "@/components/button-link";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/utils/api-client";
import { signInPath } from "@/utils/auth-routes";
import { cvEditorPath } from "@/utils/cv-editor";
import { cvsApi } from "@/utils/cvs-api";
import {
  Button,
  Flex,
  Small,
  LinearProgress,
  UserIcon,
  BagIcon,
  SkillIcon,
  GraduationCapIcon,
  FileIcon,
  GlobeIcon,
  CertificateIcon,
  EyeDropperIcon,
  FolderIcon,
  UsersIcon,
  Heading,
  IconButton,
  Tooltip,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
  StarIcon,
} from "@costor/ui";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";

// Tooltip re-measures (and sets state) whenever what `render` returns
// changes identity, so new content per render loops forever. Each label gets
// one render function that always returns the same element.
const navTooltips = new Map<string, () => ReactElement>();
const navTooltip = (label: string) => {
  let render = navTooltips.get(label);
  if (!render) {
    const content = <Small>{label}</Small>;
    render = () => content;
    navTooltips.set(label, render);
  }
  return render;
};

/** The tooltip's Panel, with only a sliver of padding around the label. */
const NAV_TOOLTIP_PANEL = { style: { padding: "2px 8px" } };

const ManageCvLayoutContent = ({
  children,
  cvId,
}: TManageCvLayoutContentProps) => {
  const { data, completion } = useCv();
  const [exportOpen, setExportOpen] = useState(false);
  // Red while a required field is empty, green once everything is filled.
  const completionColor = !completion.requiredComplete
    ? "error"
    : completion.percent === 100
      ? "success"
      : "primary";
  const pathname = usePathname();
  const router = useRouter();

  const navItems = useMemo<TManageCvLayoutNavItem[]>(() => {
    const basePath = cvEditorPath(cvId);

    return [
      {
        label: "Templates",
        description: "Choose a layout that best showcases your experience",
        href: `${basePath}/templates`,
        icon: <FolderIcon />,
      },
      {
        label: "Appearance",
        description: "Personalize the look, colors, and style of your CV",
        href: `${basePath}/appearance`,
        icon: <EyeDropperIcon />,
      },
      {
        label: "Personal Information",
        description: "Introduce yourself with your essential contact details",
        href: `${basePath}/personal-information`,
        icon: <UserIcon />,
      },
      {
        label: "Social Media",
        description: "Connect your professional profiles and online presence",
        href: `${basePath}/social-media`,
        icon: <UsersIcon />,
      },
      {
        label: "Work Experience",
        description: "Highlight your roles, responsibilities, and achievements",
        href: `${basePath}/work-experience`,
        icon: <BagIcon />,
        count: data.workExperience.length,
      },
      {
        label: "Education",
        description: "Showcase your academic background and qualifications",
        href: `${basePath}/education`,
        icon: <GraduationCapIcon />,
        count: data.education.length,
      },
      {
        label: "Skills",
        description: "Highlight the abilities and expertise you bring",
        href: `${basePath}/skills`,
        icon: <SkillIcon />,
        count: data.skills.length,
      },
      {
        label: "Languages",
        description: "Show the languages you speak and your proficiency",
        href: `${basePath}/languages`,
        icon: <GlobeIcon />,
        count: data.languages.length,
      },
      {
        label: "Projects",
        description: "Showcase meaningful work and projects you've built",
        href: `${basePath}/projects`,
        icon: <FileIcon />,
        count: data.projects.length,
      },
      {
        label: "Certificates",
        description: "Highlight certifications and professional achievements",
        href: `${basePath}/certificates`,
        icon: <CertificateIcon />,
        count: data.certificates.length,
      },
      {
        label: "Interests",
        description: "Share the hobbies and interests that make you, you",
        href: `${basePath}/interests`,
        icon: <StarIcon />,
        count: data.interests.length,
      },
    ];
  }, [cvId, data]);

  const activeItemId = useMemo<number>(() => {
    return navItems.findIndex((item) => item.href === pathname);
  }, [navItems, pathname]);

  const activeNavItem = useMemo<TManageCvLayoutNavItem | undefined>(() => {
    return navItems[activeItemId];
  }, [navItems, activeItemId]);

  const onBack = useCallback(() => {
    if (activeItemId > 0) {
      router.push((navItems[activeItemId - 1] as TManageCvLayoutNavItem)?.href);
    }
  }, [activeItemId, navItems, router]);

  const isLastStep = activeItemId === navItems.length - 1;
  // Finishing needs every required field, on every step, to be filled.
  const canFinish = completion.requiredComplete;
  // Sample data only while picking a template or its appearance; the other
  // steps (and the PDF) show just what was filled in.
  const showPlaceholders =
    pathname.endsWith("/templates") || pathname.endsWith("/appearance");

  // "Finish" on the last step opens the export modal.
  const onNext = useCallback(() => {
    if (isLastStep) {
      if (canFinish) setExportOpen(true);
      return;
    }
    router.push((navItems[activeItemId + 1] as TManageCvLayoutNavItem)?.href);
  }, [isLastStep, canFinish, activeItemId, navItems, router]);

  return (
    <SManageCvLayout>
      <SManageCvLayoutCardWrapper>
        <SManageCvLayoutCard radius="lg">
          <SManageCvLayoutBrand>
            <Image src="/logo.png" alt="" width={40} height={40} priority />
          </SManageCvLayoutBrand>
          <SManageCvLayoutCardHeader>
            <Heading as="h6">{activeNavItem?.label}</Heading>
            <Small color="secondary">{activeNavItem?.description}</Small>
          </SManageCvLayoutCardHeader>
          <SManageCvLayoutNavContent direction="column" align="center" gap={2}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Tooltip
                  key={item.href}
                  placement="right"
                  render={navTooltip(item.label)}
                  slotProps={{ panel: NAV_TOOLTIP_PANEL }}
                >
                  <IconButton
                    size="lg"
                    variant={active ? "solid" : "ghost"}
                    color={active ? "primary" : "default"}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => router.push(item.href)}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              );
            })}
            <SManageCvLayoutNavActions>
              <ThemeToggle />
            </SManageCvLayoutNavActions>
          </SManageCvLayoutNavContent>
          <SManageCvLayoutContent>{children}</SManageCvLayoutContent>
          <SManageCvLayoutCardFooter variant="border">
            <SManageCvLayoutCompletion direction="column">
              <Small color="secondary">CV COMPLETION</Small>
              <Flex direction="row" gap={2} align="center">
                <LinearProgress
                  value={completion.percent}
                  max={100}
                  color={completionColor}
                  variant="subtle"
                />
                <Small>{completion.percent}%</Small>
              </Flex>
            </SManageCvLayoutCompletion>
            <Flex justify="flex-end" gap={2}>
              <Button disabled={activeItemId === 0} onClick={onBack}>
                Back
              </Button>
              <Button
                color="primary"
                disabled={isLastStep && !canFinish}
                onClick={onNext}
              >
                {isLastStep ? "Finish" : "Continue"}
              </Button>
            </Flex>
          </SManageCvLayoutCardFooter>
        </SManageCvLayoutCard>
      </SManageCvLayoutCardWrapper>
      <SManageCvLayoutPreview>
        <SManageCvLayoutPreviewCenter>
          <CvPlaceholders enabled={showPlaceholders}>
            <CvDisplay />
          </CvPlaceholders>
        </SManageCvLayoutPreviewCenter>
      </SManageCvLayoutPreview>
      <CvExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        cvId={cvId}
      />
    </SManageCvLayout>
  );
};

/** Placeholder layout while the saved CV loads. */
const ManageCvLayoutSkeleton = () => (
  <SManageCvLayout aria-busy>
    <SManageCvLayoutCardWrapper>
      <Skeleton width="100%" height="100%" radius="lg" />
    </SManageCvLayoutCardWrapper>
    <SManageCvLayoutPreview>
      <SManageCvLayoutPreviewCenter>
        <Skeleton
          width="100%"
          height="auto"
          style={{ aspectRatio: "210 / 297" }}
        />
      </SManageCvLayoutPreviewCenter>
    </SManageCvLayoutPreview>
  </SManageCvLayout>
);

/** Signed-in only; loads the saved CV when editing one. */
const ManageCvLayoutLoader = ({ children, cvId }: TManageCvLayoutProps) => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [load, setLoad] = useState<TManageCvLayoutLoad>();
  const signedIn = auth.status === "signed-in";

  useEffect(() => {
    if (auth.status !== "signed-out") return;
    router.replace(signInPath(pathname));
  }, [auth.status, router, pathname]);

  useEffect(() => {
    if (!signedIn || !cvId) return;
    let active = true;
    cvsApi.get(cvId).then(
      (cv) => active && setLoad({ cvId, cv }),
      (error: unknown) =>
        active &&
        setLoad({
          cvId,
          error:
            error instanceof ApiError
              ? error.message
              : "Couldn't reach the server. Try again.",
          notFound: error instanceof ApiError && error.status === 404,
        }),
    );
    return () => {
      active = false;
    };
  }, [signedIn, cvId]);

  if (!signedIn) return <ManageCvLayoutSkeleton />;
  if (!cvId) {
    return (
      <CvProvider>
        <ManageCvLayoutContent>{children}</ManageCvLayoutContent>
      </CvProvider>
    );
  }

  const current = load?.cvId === cvId ? load : undefined;
  if (!current) return <ManageCvLayoutSkeleton />;
  if ("error" in current) {
    return (
      <SManageCvLayoutMessage>
        <Empty variant="surface" radius="lg">
          <EmptyHeader>
            <EmptyTitle>
              {current.notFound ? "CV not found" : "Couldn't open this CV"}
            </EmptyTitle>
            <EmptyDescription>
              {current.notFound
                ? "It may have been deleted, or it belongs to another account."
                : current.error}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              as={ButtonLink}
              href="/dashboard"
              variant="solid"
              color="primary"
            >
              Back to my CVs
            </Button>
          </EmptyContent>
        </Empty>
      </SManageCvLayoutMessage>
    );
  }

  const { cv } = current;
  return (
    <CvProvider
      key={cv.id}
      initialData={cv.data}
      initialAppearance={cv.appearance}
      initialFileName={cv.name}
    >
      <ManageCvLayoutContent cvId={cv.id}>{children}</ManageCvLayoutContent>
    </CvProvider>
  );
};

const ManageCvLayout = ({ children, cvId }: TManageCvLayoutProps) => (
  <AuthProvider>
    <ManageCvLayoutLoader cvId={cvId}>{children}</ManageCvLayoutLoader>
  </AuthProvider>
);

export default ManageCvLayout;

