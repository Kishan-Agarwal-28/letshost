import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Plus, Trash2, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScriptCopyBtn } from "@/components/magicui/script-copy-btn";
import RegisterDomain from "./registerDomain";
import { useApiPost, useApiGet } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useToast } from "@/hooks/use-toast";
import UpdateDomain from "./updateDomain";

interface Subdomain {
  subDomain: string;
  public: boolean;
  projectID: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export default function Dashboard() {
  const [subdomains, setSubdomains] = useState<Array<Subdomain>>([]);
  const [presignedUrls, setPresignedUrls] = useState<{
    [subDomain: string]: string;
  }>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();

  const getUser = useApiGet({
    key: ["getUser"],
    path: ApiRoutes.getUserDetails,
    enabled: false,
  });
  useEffect(() => {
    getUser.refetch();
  }, []);
  useEffect(() => {
    if (getUser.isSuccess) {
      setSubdomains(getUser.data?.data?.data?.subdomains);
    }
    if (getUser.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(getUser),
        variant: "error",
        duration: 5000,
      });
    }
  }, [getUser.isSuccess, getUser.isError, getUser.dataUpdatedAt]);
  const getPresignedUrl = useApiPost({
    type: "post",
    key: ["getPresignedUrl"],
    path: ApiRoutes.getViewSignedUrl,
  });
  const deleteSubdomain = useApiPost({
    type: "post",
    key: ["deleteSubdomain"],
    path: ApiRoutes.deleteDomain,
  });
  const updateSubdomainVisibility = useApiPost({
    type: "post",
    key: ["updateSubdomainVisibility"],
    path: ApiRoutes.updateVisibility,
  });

  const handleGetPresignedUrl = async (subdomain: string) => {
    setLoadingUrl(subdomain);
    try {
      const response = await getPresignedUrl.mutateAsync({
        subDomain: subdomain,
      });
      const url = response?.data?.data;
      setPresignedUrls((prev) => ({ ...prev, [subdomain]: url }));
    } catch (error) {
      console.error("Failed to fetch presigned URL:", error);
    } finally {
      setLoadingUrl(null);
    }
  };
  const handledeleteSubdomain = (subdomain: string) => {
    deleteSubdomain.mutate({ subDomain: subdomain });
  };
  const handleUpdateSubdomainVisibility = (
    subdomain: string,
    visibility: boolean,
  ) => {
    updateSubdomainVisibility.mutate({
      subDomain: subdomain,
      visibility: visibility ? "public" : "private",
    });

    // Update state optimistically
    setSubdomains((prevSubdomains) =>
      prevSubdomains.map((item) =>
        item.subDomain === subdomain ? { ...item, public: visibility } : item,
      ),
    );
  };

  useEffect(() => {
    if (deleteSubdomain.isSuccess) {
      setSubdomains((prevSubdomains) =>
        prevSubdomains.filter(
          (item) => item.subDomain !== deleteSubdomain.variables.subDomain,
        ),
      );
      toast({
        title: "Success",
        description: "Subdomain deleted successfully",
        variant: "success",
        duration: 5000,
      });
    }
    if (deleteSubdomain.isError) {
      toast({
        title: "Error",
        description: deleteSubdomain.error?.message,
        variant: "error",
        duration: 5000,
      });
    }
    if (updateSubdomainVisibility.isSuccess) {
      toast({
        title: "Success",
        description: "Subdomain visibility updated successfully",
        variant: "success",
        duration: 5000,
      });
    }
    if (updateSubdomainVisibility.isError) {
      toast({
        title: "Error",
        description: updateSubdomainVisibility.error?.message,
        variant: "error",
        duration: 5000,
      });
    }
  }, [
    deleteSubdomain.isSuccess,
    deleteSubdomain.isError,
    toast,
    updateSubdomainVisibility.isSuccess,
    updateSubdomainVisibility.isError,
  ]);

  // Filter and search logic
  const filteredSubdomains = useMemo(() => {
    let filtered = subdomains || [];

    // Filter by tab
    if (activeTab === "public") {
      filtered = filtered.filter((subdomain) => subdomain.public);
    } else if (activeTab === "private") {
      filtered = filtered.filter((subdomain) => !subdomain.public);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (subdomain) =>
          subdomain.subDomain
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subdomain.projectID.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  }, [subdomains, activeTab, searchTerm]);

  // Tab counts
  const publicCount = subdomains?.filter((s) => s.public).length || 0;
  const privateCount = subdomains?.filter((s) => !s.public).length || 0;
  const totalCount = subdomains?.length || 0;

  const tabs = [
    { id: "all", label: "All", count: totalCount },
    { id: "public", label: "Public", count: publicCount },
    { id: "private", label: "Private", count: privateCount },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground relative">
      {/* Header */}
      <header className="w-full mb-8 flex flex-col md:flex-row justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          You're using <strong>{subdomains?.length}</strong> out of{" "}
          <strong>10</strong> subdomains.
        </p>
      </header>

      {/* Search and Tabs */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[200px] justify-start gap-2"
              >
                <Search className="w-4 h-4" />
                {searchTerm || "Search subdomains..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="Search by subdomain or project ID..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No subdomains found.</CommandEmpty>
                  <CommandGroup>
                    {subdomains?.map((subdomain, index) => (
                      <CommandItem
                        key={index}
                        value={`${subdomain.subDomain} ${subdomain.projectID}`}
                        onSelect={() => {
                          setSearchTerm(subdomain.subDomain);
                          setSearchOpen(false);
                        }}
                        className="flex flex-col items-start gap-1"
                      >
                        <div className="font-medium">{subdomain.subDomain}</div>
                        <div className="text-xs text-muted-foreground">
                          {subdomain.projectID}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear search button */}
        {searchTerm && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="text-xs"
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      {(searchTerm || activeTab !== "all") && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredSubdomains.length} of {totalCount} subdomains
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}

      {/* Subdomain List */}
      <section className="space-y-4">
        {filteredSubdomains.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm
                ? `No subdomains found matching "${searchTerm}"`
                : `No ${activeTab === "all" ? "" : activeTab} subdomains found`}
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                size="sm"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredSubdomains.map((subdomain, index) => (
              <AccordionItem
                key={index}
                value={subdomain?.subDomain}
                className="border rounded-xl px-4 py-3 shadow-sm my-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <div className="text-sm font-medium break-words">
                    {subdomain?.subDomain}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        subdomain?.public
                          ? "bg-green-500 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {subdomain?.public ? "Public" : "Private"}
                    </span>
                    <AccordionTrigger />
                  </div>
                </div>

                <AccordionContent className="mt-4 space-y-6 text-sm">
                  {/* Project Info + Update Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <p className="text-muted-foreground">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-400 text-white mr-3">
                        PROJECT ID:
                      </span>
                      {subdomain?.projectID}
                    </p>
                    <UpdateDomain
                      {...{ subdomain: subdomain?.subDomain }}
                      onUpdateSuccess={() => getUser.refetch()}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`public-${index}`}
                        defaultChecked={subdomain?.public}
                        onCheckedChange={(checked) =>
                          handleUpdateSubdomainVisibility(
                            subdomain?.subDomain,
                            checked,
                          )
                        }
                      />
                      <Label htmlFor={`public-${index}`}>
                        Toggle Public Access
                      </Label>
                    </div>

                    {/* Presigned + Actions */}
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                      {presignedUrls[subdomain?.subDomain] && (
                        <ScriptCopyBtn
                          showMultiplePackageOptions={false}
                          codeLanguage="text"
                          lightTheme=""
                          darkTheme="vitesse-dark"
                          commandMap={{
                            "Your Presigned URL":
                              presignedUrls[subdomain?.subDomain],
                          }}
                        />
                      )}

                      <Button
                        variant="outline"
                        onClick={() =>
                          handleGetPresignedUrl(subdomain?.subDomain)
                        }
                        disabled={loadingUrl === subdomain?.subDomain}
                        className="min-w-[140px]"
                      >
                        {loadingUrl === subdomain?.subDomain
                          ? "Loading..."
                          : "Get Presigned URL"}
                      </Button>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="flex items-center gap-1 hover:scale-105 transition-transform"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the subdomain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handledeleteSubdomain(subdomain?.subDomain)
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      {/* Floating Add Button */}
      <RegisterDomain>
        <Button
          size="icon"
          className="rounded-full h-14 w-14 bg-green-500 text-white fixed bottom-8 right-6 shadow-lg hover:scale-105 transition-transform"
          aria-label="Add Subdomain"
        >
          <Plus size={24} />
        </Button>
      </RegisterDomain>
    </div>
  );
}
