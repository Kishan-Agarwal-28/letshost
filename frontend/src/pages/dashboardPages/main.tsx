import Dashboard from "@/pages/dashboardPages/dashboard.tsx";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sparkles, ChartPie, Upload, Settings } from "lucide-react";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { IoMdImages } from "react-icons/io";
import type { JSX } from "react/jsx-runtime";
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
import CdnPage from "../cdnPages/cdnPage";
import ImageEditor from "../imageTransformerspage/transformation";
import AIImageGenerator from "../imageTransformerspage/ai-image";
import FileUploader from "../cdnPages/fileUploader";
import Analytics from "../analyticsPage/analytics";
import SettingsPage from "@/pages/profileSettingsPage/settings";
import CreatorDashboard from "../creatorpages/creatordashboard";

type PageKey =
  | "dashboard"
  | "cdnDashboard"
  | "imageEditor"
  | "AiImageGenerator"
  | "fileUploader"
  | "Settings"
  | "analytics"
  | "creatordashboard";

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
    Settings: <SettingsPage/>,
    creatordashboard:<CreatorDashboard/>
  };

  const [page, setPage] = useState<PageKey>("dashboard");
  const menuSections: MenuSection[] = [
  {
    label: "Dashboard",
    items: [
      {
        id: "dashboard",
        label: "View Dashboard",
        icon: LuLayoutDashboard,
        page: "dashboard"
      }
    ]
  },
  {
    label: "CDN",
    items: [
      {
        id: "cdn-dashboard",
        label: "Dashboard",
        icon: MdOutlineDashboardCustomize,
        page: "cdnDashboard"
      },
      {
        id: "image-editor",
        label: "Image Transformation",
        icon: IoMdImages,
        page: "imageEditor"
      },
      {
        id: "ai-generator",
        label: "AI Image Generator",
        icon: Sparkles,
        page: "AiImageGenerator"
      },
      {
        id: "file-uploader",
        label: "Upload Files",
        icon: Upload,
        page: "fileUploader"
      }
    ]
  },
  {
    label: "Analytics",
    items: [
      {
        id: "analytics",
        label: "View Analytics",
        icon: ChartPie,
        page: "analytics"
      }
    ]
  },
  {
    label: "Creator Dashboard",
    items: [
      {
        id: "creator-dashboard",
        label: "View Creator Dashboard",
        icon: RiDashboardHorizontalLine,
        page: "creatordashboard"
      }
    ]
  },
  {
    label: "Settings",
    items: [
      {
        id: "settings",
        label: "View Profile",
        icon: Settings,
        page: "Settings"
      }
    ]
  }
];

  const handlePageUpdate = (page: PageKey) => {
    setPage(page);
  };
  return (
    <>
      <SidebarProvider>
         <Sidebar 
      variant="floating" 
      className={`relative`} 
      collapsible="icon"
    >
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
                      className="cursor-pointer"
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
          {pages[page]}
        </main>
      </SidebarProvider>
    </>
  );
}
export default DashboardLayout;
