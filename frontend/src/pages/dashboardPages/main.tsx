import Dashboard from "@/pages/dashboardPages/dashboard.tsx";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles, ChartPie, Upload, Settings,  ImageUp, ImagePlus } from "lucide-react";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { IoMdImages } from "react-icons/io";
import type { JSX } from "react/jsx-runtime";
import { lazy, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import SuspenseWrapper from "../../../suspense.tsx";
const CdnPage = lazy(() => import("../cdnPages/cdnPage"));
const ImageEditor = lazy(
  () => import("../imageTransformerspage/transformation")
);
const AIImageGenerator = lazy(
  () => import("../imageTransformerspage/ai-image")
);
const FileUploader = lazy(() => import("../cdnPages/fileUploader"));
const Analytics = lazy(() => import("../analyticsPage/analytics"));
const SettingsPage = lazy(() => import("@/pages/profileSettingsPage/settings"));
const CreatorDashboard = lazy(() => import("../creatorpages/creatordashboard"));
const Gallery = lazy(() => import("@/pages/galleryPage/gallery"));
import { useSearchParams } from "react-router-dom";

type PageKey =
  | "dashboard"
  | "cdnDashboard"
  | "imageEditor"
  | "AiImageGenerator"
  | "fileUploader"
  | "Settings"
  | "analytics"
  | "creatordashboard"
  | "gallery-likes"
  | "gallery-saves";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  page: PageKey;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

function formatPageName(key: string): string {
  return (
    key
      // Insert space before capital letters
      .replace(/([A-Z])/g, " $1")
      // Capitalize the first letter
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

function DashboardLayout() {
  const pages: Record<PageKey, JSX.Element> = {
    dashboard: <Dashboard />,
    cdnDashboard: <CdnPage />,
    imageEditor: <ImageEditor />,
    AiImageGenerator: <AIImageGenerator />,
    fileUploader: <FileUploader />,
    analytics: <Analytics />,
    Settings: <SettingsPage />,
    creatordashboard: <CreatorDashboard />,
    "gallery-likes": <Gallery />,
    "gallery-saves": <Gallery />,
  };

  const [page, setPage] = useState<PageKey>("dashboard");
  const [searchParams, setSearchParams] = useSearchParams();
useEffect(() => {
  if (searchParams.get("page")) {
    const pageParam = searchParams.get("page") as PageKey;
    setPage(pageParam);

    const params = Object.fromEntries(searchParams.entries());

    if (pageParam === "gallery-likes") {
      setSearchParams({ ...params, showLikes: "true" });
    } else if (pageParam === "gallery-saves") {
      setSearchParams({ ...params, showSaves: "true" });
    }
  } else {
    setSearchParams({ page });
  }
}, []);


  const menuSections: MenuSection[] = [
    {
      label: "Dashboard",
      items: [
        {
          id: "dashboard",
          label: "View Dashboard",
          icon: LuLayoutDashboard,
          page: "dashboard",
        },
      ],
    },
    {
      label: "CDN",
      items: [
        {
          id: "cdn-dashboard",
          label: "Dashboard",
          icon: MdOutlineDashboardCustomize,
          page: "cdnDashboard",
        },
        {
          id: "image-editor",
          label: "Image Transformation",
          icon: IoMdImages,
          page: "imageEditor",
        },
        {
          id: "ai-generator",
          label: "AI Image Generator",
          icon: Sparkles,
          page: "AiImageGenerator",
        },
        {
          id: "file-uploader",
          label: "Upload Files",
          icon: Upload,
          page: "fileUploader",
        },
      ],
    },
    {
      label: "Analytics",
      items: [
        {
          id: "analytics",
          label: "View Analytics",
          icon: ChartPie,
          page: "analytics",
        },
      ],
    },
    {
      label: "Creator Dashboard",
      items: [
        {
          id: "creator-dashboard",
          label: "View Creator Dashboard",
          icon: RiDashboardHorizontalLine,
          page: "creatordashboard",
        },
      ],
    },
    {
      label: "Gallery",
      items: [
        {
          id: "gallery-likes",
          label: "View Liked Images",
          icon: ImagePlus,
          page: "gallery-likes",
        },
        {
          id: "gallery-saves",
          label: "View Saved Images",
          icon: ImageUp,
          page: "gallery-saves",
        }
      ],
    },
    {
      label: "Settings",
      items: [
        {
          id: "settings",
          label: "View Profile",
          icon: Settings,
          page: "Settings",
        },
      ],
    },
  ];

  const handlePageUpdate = (page: PageKey) => {
    setPage(page);
   if(page==="gallery-likes"){
    setSearchParams({ page, showLikes: "true" });
  }
  else if(page==="gallery-saves"){
    setSearchParams({ page, showSaves: "true" });
  }
 else{
    setSearchParams({ page });
 }
  };
  return (
    <>
      <SidebarProvider>
        <Sidebar variant="floating" className={`relative`} collapsible="icon">
          <SidebarContent className="flex flex-col items-center">
            {menuSections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <SidebarMenuItem
                          key={item.id}
                          className={`cursor-pointer ${item.page === page ? "bg-sidebar-accent rounded-md" : ""}`}
                          onClick={() => handlePageUpdate(item.page)}
                        >
                          <SidebarMenuButton asChild>
                            <span>
                              <IconComponent />
                              <span>{item.label}</span>
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <main className="w-screen">
          <div className="flex gap-5 items-center">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <span>{formatPageName(page).toUpperCase()}</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SuspenseWrapper>{pages[page]}</SuspenseWrapper>
        </main>
      </SidebarProvider>
    </>
  );
}
export default DashboardLayout;
