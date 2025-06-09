import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormFieldComp from "./FormFieldComp";
import { useApiPost } from "@/hooks/apiHooks";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import ApiRoutes from "@/connectors/api-routes";
import { getErrorMsg } from "@/lib/getErrorMsg";
function ChangePassword() {
  const changePasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ),
      confirmPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams({ token: "" });
  const token = searchParams.get("token");
  const changePassword = useApiPost({
    key: ["changePassword"],
    path: ApiRoutes.changePassword,
    type: "post",
  });
  const onSubmit = (data: z.infer<typeof changePasswordSchema>) => {
    changePassword.mutate({
      verificationToken: token,
      newPassword: data.password,
    });
  };
  useEffect(() => {
    if (changePassword.isSuccess) {
      toast({
        title: "Password changed successfully",
        description: "Please login with your new password",
        variant: "success",
        duration: 5000,
      });
      navigate("/auth?mode=login");
    }
    if (changePassword.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(changePassword),
        variant: "error",
        duration: 5000,
      });
    }
  }, [changePassword.isSuccess, changePassword.isError, toast]);
  return (
    <div className="w-full h-dvh flex items-center-safe justify-center-safe">
      <div className="bg-black rounded-2xl w-1/2 min-h-[90%] flex flex-col justify-center items-center shadow-2xl p-8">
        <h1 className="text-2xl font-bold mx-auto p-1">Change Password</h1>

        <div className="w-[80%]">
          <Form {...changePasswordForm}>
            <form
              onSubmit={changePasswordForm.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <div className="relative">
                <FormFieldComp
                  form={changePasswordForm}
                  name="password"
                  labelValue="Password"
                  descriptionValue="Enter your Password"
                  placeholderValue="Password"
                  type={`${showPassword ? "text" : "password"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 ${changePasswordForm.formState.errors.password ? "translate-y-[-25px]" : "-translate-y-1/2"} text-muted-foreground cursor-pointer`}
                >
                  {showPassword ? (
                    <FaEyeSlash size={20} />
                  ) : (
                    <FaEye size={20} />
                  )}
                </button>
              </div>
              <div className="relative">
                <FormFieldComp
                  form={changePasswordForm}
                  name="confirmPassword"
                  labelValue="Confirm Password"
                  descriptionValue="Confirm your Password"
                  placeholderValue="Confirm Password"
                  type={`${showConfirmPassword ? "text" : "password"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 ${changePasswordForm.formState.errors.confirmPassword ? "translate-y-[-25px]" : "-translate-y-1/2"} text text-muted-foreground cursor-pointer`}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash size={20} />
                  ) : (
                    <FaEye size={20} />
                  )}
                </button>
              </div>
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
      </div>
    </div>
  );
}

export default ChangePassword;
