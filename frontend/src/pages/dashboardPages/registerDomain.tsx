// components/ForgotPassword.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiPost, useApiGet } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
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
import { useConfettiCannon } from "@/components/ui/confetti-cannon";

const formSchema = z.object({
  subDomain: z.string().min(1, "Subdomain is required"),
  files: z.array(z.instanceof(File)).min(1),
});

type RegisterDomainFormData = z.infer<typeof formSchema>;

const RegisterDomain = ({ children }: React.PropsWithChildren) => {
  const [fileTree, setFileTree] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { toast } = useToast();
  const confettiCannon = useConfettiCannon;
  const form = useForm<RegisterDomainFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { subDomain: "", files: undefined },
  });

  const registerDomain = useApiPost({
    key: ["registerDomain"],
    path: ApiRoutes.registerDomain,
    sendingFile: true,
    type: "post",
  });
  const getUser = useApiGet({
    key: ["getUser"],
    path: ApiRoutes.getUserDetails,
    enabled: false,
  });
  const onSubmit = async (values: RegisterDomainFormData) => {
    setUploadProgress(0);
    registerDomain.mutate({
      subDomain: values.subDomain,
      files: values.files,
    });
  };

  useEffect(() => {
    if (registerDomain.isSuccess) {
      form.reset();
      setFileTree(null);
      setUploadProgress(0);
      toast({
        title: "Success",
        description: "Subdomain registered successfully",
        variant: "success",
        duration: 5000,
      });
      confettiCannon();
      getUser.refetch();
    }
    if (registerDomain.isError) {
      toast({
        title: "Error",
        description: registerDomain.error?.message,
        variant: "error",
        duration: 5000,
      });
    }
  }, [
    registerDomain.isSuccess,
    registerDomain.isError,
    registerDomain.error?.message,
    form,
    toast,
  ]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="text-muted-foreground hover:text-white hover:underline cursor-pointer absolute right-3">
          {children}
        </span>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Deploy a new Project </DialogTitle>
              <DialogDescription>
                Enter the subdomain you want your project to be hosted on.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="subDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain</FormLabel>
                    <FormControl>
                      <Input placeholder="example" type="text" {...field} />
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
            <div className="flex items-center justify-center w-full ">
              <FormField
                control={form.control}
                name="files"
                render={() => (
                  <FormItem>
                    <FormLabel className="w-2/3 flex-col justify-center items-center cursor-pointer text-center text-nowrap">
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
              <div className="w-1/3 h-50">
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
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-sm text-center mt-2">
                  Uploading: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  registerDomain.isPending ||
                  (uploadProgress > 0 && uploadProgress < 100)
                }
              >
                {registerDomain.isPending
                  ? `Deploying${uploadProgress > 0 ? `: ${Math.round(uploadProgress)}%` : "..."}`
                  : "Deploy"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDomain;
