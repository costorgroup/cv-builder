"use client";

import Image from "next/image";
import { CvDisplay, CvExportModal, ThemeToggle } from "@/components";
import { CvPlaceholders, CvProvider, useCv } from "@/providers/cv-provider";
import {
  SManageCvLayout,
  SManageCvLayoutCenter,
  SManageCvLayoutNavLink,
  SManageCvLayoutCardWrapper,
  SManageCvLayoutCard,
  SManageCvLayoutCompletion,
  SManageCvLayoutNavContent,
  SManageCvLayoutBrand,
  SManageCvLayoutCardHeader,
  SManageCvLayoutCardFooter,
  SManageCvLayoutContent,
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
  Badge,
  Heading,
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
        description: "Choose a layout that best showcases your experience",
        href: `/${prefix}/templates`,
        icon: <FolderIcon />,
      },
      {
        label: "Appearance",
        description: "Personalize the look, colors, and style of your CV",
        href: `/${prefix}/appearance`,
        icon: <EyeDropperIcon />,
      },
      {
        label: "Personal Information",
        description: "Introduce yourself with your essential contact details",
        href: `/${prefix}/personal-information`,
        icon: <UserIcon />,
      },
      {
        label: "Social Media",
        description: "Connect your professional profiles and online presence",
        href: `/${prefix}/social-media`,
        icon: <UsersIcon />,
      },
      {
        label: "Work Experience",
        description: "Highlight your roles, responsibilities, and achievements",
        href: `/${prefix}/work-experience`,
        icon: <BagIcon />,
        count: data.workExperience.length,
      },
      {
        label: "Education",
        description: "Showcase your academic background and qualifications",
        href: `/${prefix}/education`,
        icon: <GraduationCapIcon />,
        count: data.education.length,
      },
      {
        label: "Skills",
        description: "Highlight the abilities and expertise you bring",
        href: `/${prefix}/skills`,
        icon: <SkillIcon />,
        count: data.skills.length,
      },
      {
        label: "Languages",
        description: "Show the languages you speak and your proficiency",
        href: `/${prefix}/languages`,
        icon: <GlobeIcon />,
        count: data.languages.length,
      },
      {
        label: "Projects",
        description: "Showcase meaningful work and projects you've built",
        href: `/${prefix}/projects`,
        icon: <FileIcon />,
        count: data.projects.length,
      },
      {
        label: "Certificates",
        description: "Highlight certifications and professional achievements",
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
          <SManageCvLayoutNavContent direction="column" gap={2}>
            {navItems.map((item) => (
              <SManageCvLayoutNavLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
              >
                {item.icon}
              </SManageCvLayoutNavLink>
            ))}
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
      <SManageCvLayoutCenter>
        <CvPlaceholders enabled={showPlaceholders}>
          <CvDisplay />
        </CvPlaceholders>
      </SManageCvLayoutCenter>
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
