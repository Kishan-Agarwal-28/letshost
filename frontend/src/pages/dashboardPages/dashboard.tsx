import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
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

export default function Dashboard() {
  const [subdomains, setSubdomains] = useState<Array<Subdomain>>([]);
  const [presignedUrls, setPresignedUrls] = useState<{
    [subDomain: string]: string;
  }>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground relative">
      {/* Header */}
      <header className="w-full mb-8 flex flex-col md:flex-row justify-between gap-2 md:gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          You’re using <strong>{subdomains?.length}</strong> out of{" "}
          <strong>10</strong> subdomains.
        </p>
      </header>

      {/* Subdomain List */}
      <section className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          {subdomains?.map((subdomain, index) => (
            <AccordionItem
              key={index}
              value={subdomain?.subDomain}
              className="border rounded-xl px-4 py-3 shadow-sm"
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
                            This action cannot be undone. This will permanently
                            delete the subdomain.
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
