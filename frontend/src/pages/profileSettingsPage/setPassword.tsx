import { PasswordInput } from "@/components/ui/password-input";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
  Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader , DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiPost } from "@/hooks/apiHooks";
import { useToast } from "@/hooks/use-toast";
import ApiRoutes from "@/connectors/api-routes";
import { getErrorMsg } from "@/lib/getErrorMsg";
import useUser from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
function SetPassword({
  open,
  checked,
  TwoFAEnabled,
}: {
  open: boolean;
  checked: boolean;
  TwoFAEnabled: boolean;
}) {
  const changePasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
      confirmPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });
      }
    });
  const changePasswordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const changePassword = useApiPost({
    key: ["changePassword"],
    path: ApiRoutes.setPasswordForOauthUser,
    type: "post",
    sendingFile: false,
  });
  const { toast } = useToast();
  const user = useUser();
  const navigate = useNavigate();
  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    if (!user) {
      return;
    }
    const res = await changePassword.mutateAsync({
      password: data.password,
    });
    if (
      res.data?.data?.message === "Password set successfully" ||
      res.status === 200
    ) {
      toast({
        title: "Password set successfully",
        description: "Please login with your new password",
        variant: "success",
        duration: 5000,
      });
      navigate(
        `/user/auth/additional-safety/2fa?action=${checked ? "enable" : "disable"}&mode=${TwoFAEnabled ? "login" : "register"}`
      );
    } else
      toast({
        title: "Error",
        description: getErrorMsg(changePassword),
        variant: "error",
        duration: 5000,
      });
  };
  return (
    <Dialog open={open}>
      <DialogContent>
      <DialogHeader>
       <DialogTitle>Set Password</DialogTitle>
       <DialogDescription>Set a password for your account to continue</DialogDescription>
      </DialogHeader>
        <div className="w-full flex flex-col gap-4">
          <Form {...changePasswordForm}>
            <form
              onSubmit={changePasswordForm.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <FormField
                control={changePasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormDescription>Enter your password.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={changePasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormDescription>Confirm your Password</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="w-full text-white rounded-2xl cursor-pointer flex items-center justify-center-safe">
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={changePassword.isPending}
                >
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default SetPassword;
