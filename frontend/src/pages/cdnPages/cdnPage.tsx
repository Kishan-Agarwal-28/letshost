import { BsFiletypeJs, BsFiletypeCss } from "react-icons/bs";
import { CiVideoOff, CiImageOff } from "react-icons/ci";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Calendar,
  Search,
  Edit2,
} from "lucide-react";

import { useUserStore, type ICDn } from "@/store/store";
import { useApiGet, useApiPost } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { formatBytes } from "bytes-formatter";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CompactFileUploader from "./compactFileUploader";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogDescription } from "@/components/ui/dialog";
dayjs.extend(relativeTime);

// Aceternity Tabs Component
const Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-muted/20 rounded-lg mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
            ${
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

function formatVersion(num: number): string {
  const str = num.toString().padStart(3, "0");
  return `${str[0]}.${str[1]}.${str[2]}`;
}

type SortOption = "newest" | "oldest" | "name" | "size";

function CdnPage() {
  const [hasContent] = useState(true);
  const [cdns, setCdns] = useState<ICDn[]>([]);
  const [searchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchOpen, setSearchOpen] = useState(false);
  const [updatingCdnId, setUpdatingCdnId] = useState<string | null>(null);


  const { toast } = useToast();
  const userStore = useUserStore();

  const getCDN = useApiGet({
    key: ["getCDN"],
    path: ApiRoutes.getCDN,
    enabled: false,
  });

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    getCDN.refetch();
  }, []);

  useEffect(() => {
    if (getCDN.isSuccess) {
      setCdns(getCDN.data?.data.data);
      userStore.updateUser({ cdns: getCDN.data?.data.data });
    } else if (getCDN.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(getCDN),
        variant: "error",
        duration: 5000,
      });
    }
  }, [getCDN.isSuccess, getCDN.isError, getCDN.dataUpdatedAt, toast]);

  // Filter and sort logic
  const { filteredAndSortedCdns, tabs } = useMemo(() => {
    let filtered = cdns;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cdn) =>
          cdn.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cdn.cdnProjectID.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((cdn) => cdn.fileType === activeTab);
    }

    // Sort files
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.filename.localeCompare(b.filename);
        case "size":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    // Create tabs with counts
    const fileTypeCounts = cdns.reduce(
      (acc, cdn) => {
        acc[cdn.fileType] = (acc[cdn.fileType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const tabsData = [
      { id: "all", label: "All Files", count: cdns.length },
      { id: "js", label: "JavaScript", count: fileTypeCounts.js || 0 },
      { id: "css", label: "CSS", count: fileTypeCounts.css || 0 },
      { id: "image", label: "Images", count: fileTypeCounts.image || 0 },
      { id: "video", label: "Videos", count: fileTypeCounts.video || 0 },
    ].filter((tab) => tab.count > 0 || tab.id === "all");

    return { filteredAndSortedCdns: sorted, tabs: tabsData };
  }, [cdns, searchQuery, activeTab, sortBy]);

  // Group files by type for better organization
  const groupedCdns = useMemo(() => {
    if (activeTab !== "all") return { [activeTab]: filteredAndSortedCdns };

    return filteredAndSortedCdns.reduce(
      (acc, cdn) => {
        if (!acc[cdn.fileType]) acc[cdn.fileType] = [];
        acc[cdn.fileType].push(cdn);
        return acc;
      },
      {} as Record<string, ICDn[]>,
    );
  }, [filteredAndSortedCdns, activeTab]);

  const handleFileSelect = (cdn: ICDn) => {
    setSearchOpen(false);
    // Scroll to the file card
    const element = document.getElementById(`cdn-${cdn.cdnProjectID}`);
    element?.scrollIntoView({ behavior: "smooth" });
  };
  const handleUpdateSuccess = () => {
    setUpdatingCdnId(null);
  };
  return (
    <>
      {/* Command Dialog for Search */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search files by name or CDN ID..." />
        <CommandList>
          <CommandEmpty>No files found.</CommandEmpty>
          <CommandGroup heading="Files">
            {cdns.map((cdn) => (
              <CommandItem
                key={cdn.cdnProjectID}
                onSelect={() => handleFileSelect(cdn)}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {cdn.fileType === "js" && (
                    <BsFiletypeJs className="w-6 h-6 text-muted-foreground" />
                  )}
                  {cdn.fileType === "css" && (
                    <BsFiletypeCss className="w-6 h-6 text-muted-foreground" />
                  )}
                  {cdn.fileType === "image" && (
                    <CiImageOff className="w-6 h-6 text-muted-foreground" />
                  )}
                  {cdn.fileType === "video" && (
                    <CiVideoOff className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{cdn.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {cdn.cdnProjectID} • {formatBytes(cdn.size)}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {cdn.fileType.toUpperCase()}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {!hasContent ? (
        <div className="w-full h-full flex flex-col gap-4 items-center justify-center bg-muted/20 rounded-md">
          <h1 className="text-3xl font-bold text-center text-muted-foreground opacity-40">
            No Files Uploaded
          </h1>
          <h1 className="text-xl font-bold text-center text-muted-foreground opacity-40">
            Please upload a file
          </h1>
        </div>
      ) : (
        <>
          {/* Header with Search and Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h1 className="text-2xl font-bold">CDN Files</h1>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => setSearchOpen(true)}
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
                <Select
                  value={sortBy}
                  onValueChange={(value: SortOption) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="size">Size (Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs for filtering */}
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Search Results Info */}
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                Found {filteredAndSortedCdns.length} files matching "
                {searchQuery}"
              </div>
            )}
          </div>

          {/* Files Display */}
          {activeTab === "all" ? (
            // Grouped view for "All Files"
            Object.entries(groupedCdns).map(([fileType, files]) => (
              <div key={fileType} className="mb-8">
                <h2 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                  {fileType === "js" && <BsFiletypeJs className="w-5 h-5" />}
                  {fileType === "css" && <BsFiletypeCss className="w-5 h-5" />}
                  {fileType === "image" && "🖼️"}
                  {fileType === "video" && "🎥"}
                  {fileType} Files ({files.length})
                </h2>
                <div className="flex flex-wrap gap-4 items-center justify-evenly">
                  {files.map((cdn) => (
                    <FileCard
                      key={cdn.cdnProjectID}
                      cdn={cdn}
                      isUpdating={updatingCdnId === cdn.cdnProjectID}
                      onUpdate={() => setUpdatingCdnId(cdn.cdnProjectID)}
                      onCancelUpdate={() => setUpdatingCdnId(null)}
                      onUpdateSuccess={handleUpdateSuccess}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Simple list view for specific file type
            <div className="flex flex-wrap gap-4 items-center justify-start">
              {filteredAndSortedCdns.map((cdn) => (
                <FileCard
                  key={cdn.cdnProjectID}
                  cdn={cdn}
                  isUpdating={updatingCdnId === cdn.cdnProjectID}
                  onUpdate={() => setUpdatingCdnId(cdn.cdnProjectID)}
                  onCancelUpdate={() => setUpdatingCdnId(null)}
                  onUpdateSuccess={handleUpdateSuccess}
                />
              ))}
            </div>
          )}

          {filteredAndSortedCdns.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground">
                No files found
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}

const FileCard = ({
  cdn,
  isUpdating,
  onUpdate,
  onCancelUpdate,
  onUpdateSuccess,
}: {
  cdn: ICDn;
  isUpdating: boolean;
  onUpdate: () => void;
  onCancelUpdate: () => void;
  onUpdateSuccess: () => void;
}) => {
  const { toast } = useToast();
  const deleteCDN = useApiPost({
    type: "post",
    key: ["deleteCDN"],
    path: ApiRoutes.deleteCDN,
    sendingFile: false,
  });
  const handleCdnDelete = async () => {
    if (confirm("Are you sure you want to delete this CDN?")) {
      const res = await deleteCDN.mutateAsync({
        cdnId: cdn.cdnProjectID,
      });
      if (res.status === 200) {
        toast({
          title: "Success",
          description: "CDN deleted successfully",
          duration: 5000,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete CDN",
          duration: 5000,
          variant: "error",
        });
      }
    }
  };
  const copyTOClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Relative path copied to clipboard",
        duration: 5000,
        variant: "success",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy relative path to clipboard",
        duration: 5000,
        variant: "error",
      });
    }
  };
  const activateTransformation=useApiPost({
    type:"post",
    path:ApiRoutes.activateTransformation,
    key:["activateTransformation"],
    sendingFile:false,
  })
  const handleTransformation=async()=>{ 
    await activateTransformation.mutateAsync({
      cdnProjectID:cdn.cdnProjectID
    })
  }
  useEffect(()=>{
    if(activateTransformation.isSuccess){
      toast({
        title: "Success",
        description: "On-the-fly transformations activated successfully",
        duration: 5000,
        variant: "success"
      });
    }
    else if(activateTransformation.isError){
      toast({
        title: "Error",
        description: getErrorMsg(activateTransformation),
        duration: 5000,
        variant: "error"
      });
    }
  },[activateTransformation.isSuccess,activateTransformation.isError,toast])
  return (
    <Card
      className={`w-[30rem] min-h-190 max-h-[55rem] relative perspective-1000 ${isUpdating ? "flip-card-active" : ""}`}
    >
      <div className="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d">
        {/* Front Card */}
        <div
          id={`cdn-${cdn.cdnProjectID}`}
          className={`w-full h-full flex flex-col justify-between absolute backface-hidden transition-transform duration-500 ${
            isUpdating ? "rotate-y-180 pointer-none:" : "rotate-y-0"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 ">
                  <span className="truncate max-w-60 p-2">{cdn.filename}</span>
                  <Badge variant="secondary" className="text-xs">
                    v{formatVersion(cdn.currentVersion)}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(cdn.createdAt).toLocaleString()}
                  </span>
                  <span>{formatBytes(cdn.size)}</span>
                  <Badge variant="outline" className="capitalize">
                    {cdn.fileType.toUpperCase()}
                  </Badge>
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  CDN ID:{cdn.cdnProjectID}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 flex-1">
            <div className="w-full h-70">
              {cdn.fileType === "js" ? (
                <BsFiletypeJs className="w-full h-full text-muted" />
              ) : cdn.fileType === "css" ? (
                <BsFiletypeCss className="w-full h-full text-muted" />
              ) : cdn.fileType === "image" ? (
                cdn.relativePath ? (
                  <img
                    src={cdn.relativePath}
                    alt=""
                    className="w-full h-full object-fill rounded-2xl"
                  />
                ) : (
                  <CiImageOff className="w-full h-full text-muted" />
                )
              ) : cdn.fileType === "video" ? (
                cdn.relativePath ? (
                  <video
                    src={cdn.relativePath}
                    loop
                    muted
                    className="w-full h-full object-fill rounded-2xl"
                  />
                ) : (
                  <CiVideoOff className="w-full h-full text-muted" />
                )
              ) : (
                ""
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">CDN URL</Label>
              <div className="flex gap-2">
                <Input
                  value={cdn.secureUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTOClipboard(cdn.secureUrl)}
                  className="gap-1 whitespace-nowrap"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm font-medium">
                  {dayjs(cdn.createdAt).fromNow()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Last Updated
                </div>
                <div className="text-sm font-medium">
                  {dayjs(cdn.updatedAt).fromNow()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">File Size</div>
                <div className="text-sm font-medium">
                  {formatBytes(cdn.size)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="text-sm font-medium">
                  v{formatVersion(cdn.currentVersion)}
                </div>
              </div>
            </div>
            <Dialog>
              <DialogTrigger>
                {(cdn.fileType === "image" || cdn.fileType === "video") &&(
            <Button variant="outline" size="sm" className="gap-2" disabled={cdn.isTransformActive} >
              On Fly Transformation
              </Button>
  )
}
              </DialogTrigger>

              <DialogContent className="w-svw">
                              <DialogHeader>On-the-fly transformations</DialogHeader>
              <DialogDescription>
                On-the-fly transformations allows you to modify the content of your files in real
                      time. This is useful for optimizing images, adding
                      watermarks, or changing the color scheme of your files.
              </DialogDescription>
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-col">
                    <div className="text-sm font-medium">
                     <span>
                       Are you sure you want to enable on-the-fly transformations?
                      <br />
                      This will allow you to modify the content of your files in real time.
                      <br />
                      <strong>Warning:</strong> This will action cannot be undone.
                      <br/>
                      You can enable it only on 5 files .
                     </span>
                    </div>
                      <Button className="mt-4 bg-red-400 hover:bg-red-300" onClick={handleTransformation} disabled={activateTransformation.isPending}>
                        Activate
                      </Button>
                    
                  </div>
                  </div>
                  </DialogContent>
            </Dialog>
          </CardContent>

          <CardFooter className="flex gap-2 pt-4 justify-around">
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(cdn.relativePath, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
              View
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const a = document.createElement("a");
                a.href = cdn.relativePath;
                a.download = cdn.filename;
                a.click();
              }}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <div className="flex gap-2">
              <Button
                size={"sm"}
                className="gap-2"
                onClick={onUpdate}
                disabled={isUpdating}
              >
                <Edit2 className="w-4 h-4" />
                {isUpdating ? "Updating..." : "Update"}
              </Button>
              <Button
                size={"sm"}
                variant="destructive"
                className="gap-2"
                onClick={handleCdnDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </CardFooter>
        </div>

        {/* Back Card */}
        <div
          className={`w-full min-h-170 max-h-[45rem] p-4 flex flex-col justify-center items-center  absolute backface-hidden transition-transform duration-500  ${
            isUpdating ? "rotate-y-0" : "rotate-y-180 pointer-none"
          }`}
        >
          <div
            className={`overflow-x-hidden  min-h-120 max-h-145 w-full flex flex-col justify-center items-center`}
          >
            <CompactFileUploader
              className="w-full h-full"
              cdnId={cdn.cdnProjectID}
              allowedFileType={cdn.fileType as "image" | "video" | "css" | "js"}
              onCancel={onCancelUpdate}
              onSuccess={onUpdateSuccess}
              purpose="cdnUpdate"
            />
          </div>
          <Button
            onClick={onCancelUpdate}
            className="w-full h-10 cursor-pointer text-base font-medium"
          >
            Cancel Update
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CdnPage;
