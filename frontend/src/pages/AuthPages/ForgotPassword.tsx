// components/ForgotPassword.tsx
// import React from "react";
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
import { useApiPost } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const forgotPass = useApiPost({
    type: "post",
    key: ["forgotPassword"],
    path: ApiRoutes.forgotPassword,
  });

  const onSubmit = (values: ForgotPasswordFormData) => {
    forgotPass.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          toast({
            title: "Reset link sent",
            description: "Check your email for the reset link.",
            variant: "success",
            duration: 5000,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to send reset link. Try again.",
            variant: "error",
            duration: 5000,
          });
        },
      }
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="text-muted-foreground hover:text-white hover:underline cursor-pointer absolute right-3">
          Forgot password?
        </span>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your email to receive a reset link.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@gmail.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={forgotPass.isPending}>
                {forgotPass.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;
