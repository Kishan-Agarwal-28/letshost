import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { CiEdit } from "react-icons/ci";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiPost } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UploadCloudIcon } from "lucide-react";
import { File as Files, Folder, Tree } from "@/components/magicui/file-tree";
import { getErrorMsg } from "@/lib/getErrorMsg";

function UpdateDomain({
  subdomain,
  onUpdateSuccess,
}: {
  subdomain: string;
  onUpdateSuccess?: () => void;
}) {
  const formSchema = z.object({
    subDomain: z.string().min(1, "Subdomain is required"),
    files: z.array(z.instanceof(File)).optional(),
  });

  type UpdateDomainFormData = z.infer<typeof formSchema>;

  const [fileTree, setFileTree] = useState<FileList | null>(null);

  const { toast } = useToast();

  const form = useForm<UpdateDomainFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { subDomain: subdomain, files: undefined },
  });

  const updateSubdomain = useApiPost({
    type: "post",
    key: ["updateSubdomain"],
    path: ApiRoutes.updateDomain,
  });

  const updateSubdomainFiles = useApiPost({
    type: "post",
    key: ["updateSubdomainFiles"],
    path: ApiRoutes.changeContent,
    sendingFile: true,
  });
  const onSubmit = async (values: UpdateDomainFormData) => {
    const filesProvided = values.files && values.files.length > 0;
    const subdomainChanged = values.subDomain !== subdomain;

    try {
      // 1. Only files updated
      if (filesProvided && !subdomainChanged) {
        await updateSubdomainFiles.mutateAsync({
          subDomain: values.subDomain,
          files: values.files,
        });
      }

      // 2. Both files and subdomain changed
      else if (filesProvided && subdomainChanged) {
        const uploadResult = await updateSubdomainFiles.mutateAsync({
          subDomain: subdomain, // Upload to old subdomain first
          files: values.files,
        });
        console.log("Upload result:", uploadResult);
        // ✅ Only continue to update subdomain if file upload succeeded
        if (uploadResult?.status !== 200) {
          throw new Error("File upload failed. Subdomain was not updated.");
        }

        await updateSubdomain.mutateAsync({
          oldSubDomain: subdomain,
          newSubDomain: values.subDomain,
        });
      }

      // 3. Only subdomain updated
      else if (!filesProvided && subdomainChanged) {
        await updateSubdomain.mutateAsync({
          oldSubDomain: subdomain,
          newSubDomain: values.subDomain,
        });
      }

      toast({
        title: "Success",
        description: "Changes applied successfully",
        variant: "success",
      });

      form.reset();
      setFileTree(null);
      onUpdateSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error)?.message || "Something went wrong.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    if (updateSubdomain.isSuccess) {
      form.reset();
      toast({
        title: "Success",
        description: "Subdomain updated successfully",
        variant: "success",
        duration: 5000,
      });
    }
    if (updateSubdomain.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(updateSubdomain),
        variant: "error",
        duration: 5000,
      });
    }
    if (updateSubdomainFiles.isSuccess) {
      toast({
        title: "Success",
        description: "Subdomain updated successfully",
        variant: "success",
        duration: 5000,
      });
    }
    if (updateSubdomainFiles.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(updateSubdomainFiles),
        variant: "error",
        duration: 5000,
      });
    }
  }, [
    updateSubdomain.isSuccess,
    updateSubdomain.isError,
    updateSubdomainFiles.isSuccess,
    updateSubdomainFiles.isError,
  ]);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="text-xs font-semibold px-3 py-0.5 rounded-2xl bg-neutral-800 text-white flex items-center gap-2 cursor-pointer">
          Edit <CiEdit size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-center">
            Edit subdomain
          </SheetTitle>
          <SheetDescription>
            Make changes to your subdomain here. Click save when you&apos;re
            done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="subDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input type="text" value="letshost.dpdns.org" disabled />
                </div>
              </div>
              <div className="flex flex-col gap-5 items-center justify-center w-full ">
                <FormField
                  control={form.control}
                  name="files"
                  render={() => (
                    <FormItem>
                      <FormLabel className="w-full flex-col justify-center items-center cursor-pointer text-center text-nowrap">
                        <UploadCloudIcon
                          size={80}
                          className=" bg-zinc-900 text-white rounded-2xl m-4 p-4 text-2xl"
                        />
                        Upload your project dist folder
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          className="hidden"
                          ref={(ref) => {
                            if (ref) {
                              ref.setAttribute("webkitdirectory", "true");
                              ref.setAttribute("directory", "true");
                            }
                          }}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fileArray = Array.from(files);
                              setFileTree(files);
                              form.setValue("files", fileArray, {
                                shouldValidate: true, // ✅ ensures Zod runs after setting
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="w-full h-60">
                  {fileTree && (
                    <>
                      <Tree initialExpandedItems={["1"]}>
                        <Folder element="dist" value={"1"}>
                          {Array.from(fileTree).map((file, index) => (
                            <Files key={index} value={`${index}`}>
                              {file.name}
                            </Files>
                          ))}
                        </Folder>
                      </Tree>
                    </>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
        <SheetFooter>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="cursor-pointer"
          >
            Save changes
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              disabled={form.formState.isSubmitting}
              className="cursor-pointer"
            >
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default UpdateDomain;
