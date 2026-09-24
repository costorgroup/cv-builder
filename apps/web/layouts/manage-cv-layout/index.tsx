"use client";

import Image from "next/image";
import { CvDisplay, CvExportModal, ThemeToggle } from "@/components";
import { CvPlaceholders, CvProvider, useCv } from "@/providers/cv-provider";
import {
  SManageCvLayout,
  SManageCvLayoutCenter,
  SManageCvLayoutNavLink,
  SManageCvLayoutNavLinkChip,
  SManageCvLayoutCardWrapper,
  SManageCvLayoutCard,
  SManageCvLayoutCompletion,
  SManageCvLayoutNavContent,
  SManageCvLayoutBrand,
} from "@/layouts/manage-cv-layout/styles";
import type {
  TManageCvLayoutNavItem,
  TManageCvLayoutProps,
} from "@/layouts/manage-cv-layout/types";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Flex,
  Small,
  Text,
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
  Link,
  Box,
} from "@costor/ui";
import { useParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

const ManageCvLayoutContent = ({ children }: TManageCvLayoutProps) => {
  const { data, completion } = useCv();
  const [exportOpen, setExportOpen] = useState(false);
  // Red while a required field is empty, green once everything is filled.
  const completionColor = !completion.requiredComplete
    ? "error"
    : completion.percent === 100
      ? "success"
      : "primary";
  const { id } = useParams<{ id?: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = useMemo<TManageCvLayoutNavItem[]>(() => {
    const prefix = ["manage-cv", id].filter(Boolean).join("/");
    return [
      {
        label: "Templates",
        href: `/${prefix}/templates`,
        icon: <FolderIcon />,
      },
      {
        label: "Appearance",
        href: `/${prefix}/appearance`,
        icon: <EyeDropperIcon />,
      },
      {
        label: "Personal Information",
        href: `/${prefix}/personal-information`,
        icon: <UserIcon />,
      },
      {
        label: "Social Media",
        href: `/${prefix}/social-media`,
        icon: <UsersIcon />,
      },
      {
        label: "Work Experience",
        href: `/${prefix}/work-experience`,
        icon: <BagIcon />,
        count: data.workExperience.length,
      },
      {
        label: "Education",
        href: `/${prefix}/education`,
        icon: <GraduationCapIcon />,
        count: data.education.length,
      },
      {
        label: "Skills",
        href: `/${prefix}/skills`,
        icon: <SkillIcon />,
        count: data.skills.length,
      },
      {
        label: "Languages",
        href: `/${prefix}/languages`,
        icon: <GlobeIcon />,
        count: data.languages.length,
      },
      {
        label: "Projects",
        href: `/${prefix}/projects`,
        icon: <FileIcon />,
        count: data.projects.length,
      },
      {
        label: "Certificates",
        href: `/${prefix}/certificates`,
        icon: <CertificateIcon />,
        count: data.certificates.length,
      },
    ];
  }, [id, data]);

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
  // Sample data only while picking a template or its appearance; the other
  // steps (and the PDF) show just what was filled in.
  const showPlaceholders =
    pathname.endsWith("/templates") || pathname.endsWith("/appearance");

  // "Finish" on the last step opens the export modal.
  const onNext = useCallback(() => {
    if (isLastStep) {
      setExportOpen(true);
      return;
    }
    router.push((navItems[activeItemId + 1] as TManageCvLayoutNavItem)?.href);
  }, [isLastStep, activeItemId, navItems, router]);

  return (
    <SManageCvLayout>
      <SManageCvLayoutCardWrapper>
        <SManageCvLayoutCard>
          <CardHeader variant="border">
            <SManageCvLayoutBrand direction="row" gap={2.5} align="center">
              <Image src="/logo.png" alt="" width={40} height={40} priority />
              <CardTitle>CV Builder</CardTitle>
            </SManageCvLayoutBrand>
          </CardHeader>
          <SManageCvLayoutNavContent>
            <Flex direction="column">
              {navItems.map((item) => (
                <SManageCvLayoutNavLink
                  key={item.href}
                  href={item.href}
                  active={pathname === item.href}
                >
                  <Flex direction="row" gap={2} align="center">
                    {item.icon}
                    {item.label}
                  </Flex>
                  {item.count !== undefined && (
                    <SManageCvLayoutNavLinkChip
                      size="xs"
                      color="primary"
                      radius="xs"
                    >
                      {item.count}
                    </SManageCvLayoutNavLinkChip>
                  )}
                </SManageCvLayoutNavLink>
              ))}
            </Flex>
            <SManageCvLayoutCompletion direction="column">
              <Text>CV Completion</Text>
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
            {/* <ThemeToggle /> */}
          </SManageCvLayoutNavContent>
          <CardFooter variant="border">
            <Flex justify="flex-end" gap={2} fullWidth>
              <Button disabled={activeItemId === 0} onClick={onBack}>
                Back
              </Button>
              <Button color="primary" onClick={onNext}>
                {isLastStep ? "Finish" : "Continue"}
              </Button>
            </Flex>
          </CardFooter>
        </SManageCvLayoutCard>
      </SManageCvLayoutCardWrapper>
      <SManageCvLayoutCenter>
        <CvPlaceholders enabled={showPlaceholders}>
          <CvDisplay />
        </CvPlaceholders>
      </SManageCvLayoutCenter>
      <SManageCvLayoutCardWrapper>
        <SManageCvLayoutCard>
          <CardHeader variant="border">
            <CardTitle>
              <Flex direction="row" gap={2} align="center">
                {activeNavItem?.label}
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </SManageCvLayoutCard>
      </SManageCvLayoutCardWrapper>
      <CvExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </SManageCvLayout>
  );
};

const ManageCvLayout = ({ children }: TManageCvLayoutProps) => (
  <CvProvider>
    <ManageCvLayoutContent>{children}</ManageCvLayoutContent>
  </CvProvider>
);

export default ManageCvLayout;

