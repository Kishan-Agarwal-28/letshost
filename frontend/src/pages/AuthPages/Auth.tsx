import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AiFillGoogleCircle, AiOutlineGithub } from "react-icons/ai";
import config from "@/config/config";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import FormFieldComp from "./FormFieldComp";
import { useApiPost, useApiGet } from "@/hooks/apiHooks";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useUserStore } from "@/store/store";
import ApiRoutes from "@/connectors/api-routes";
import ForgotPassword from "./ForgotPassword";
import { PasswordInput } from "@/components/ui/password-input";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
} from "@/components/ui/form";

function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams({
    mode: "signup",
    status: "",
  });

  const userStore = useUserStore();
  const [is2FARequired, setIs2FARequired] = useState(false);

  //@handling form and their types
  const signUpSchema = z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .regex(
          /^[a-zA-Z0-9\- ]+$/,
          "Username can only contain letters, numbers, spaces, and dashes"
        )

        .refine(
          (value) => !value.includes(" "),
          "Username cannot contain spaces"
        ),
      email: z.string().email("Please enter a valid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      // Check if password matches email or username
      if (data.password === data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password cannot be the same as email",
          path: ["password"],
        });
      }

      if (data.password === data.username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password cannot be the same as username",
          path: ["password"],
        });
      }

      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });
      }
    });

  const loginSchema = z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .regex(
          /^[a-zA-Z0-9\- ]+$/,
          "Username can only contain letters, numbers, spaces, and dashes"
        )

        .refine((val) => !val.includes(" "), "Username cannot contain spaces")
        .or(z.literal("")), // allow empty string
      email: z
        .string()
        .or(z.literal("")) // allow empty string
        .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          message: "Please enter a valid email address",
        }),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    })
    .refine((data) => data.username !== "" || data.email !== "", {
      message: "Either username or email is required",
      path: ["username"],
    });

  const modeParam = searchParams.get("mode");
  const validMode =
    modeParam === "login" || modeParam === "signup" ? modeParam : "signup";
  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const switchToLogin = () => {
    setSearchParams({ mode: "login" });
    signUpForm.reset();
    setIs2FARequired(false);
  };
  const switchToSignup = () => {
    setSearchParams({ mode: "signup" });
    loginForm.reset();
    setIs2FARequired(false);
  };

  //@handling sending of data to backend
  const register = useApiPost({
    type: "post",
    key: ["signup"],
    path: ApiRoutes.register,
  });
  const login = useApiPost({
    type: "post",
    key: ["login"],
    path: ApiRoutes.login,
  });
  const onSignuUpSubmit = (data: z.infer<typeof signUpSchema>) => {
    register.mutate(data);
  };

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    login.mutate(data);
  };
  useEffect(() => {
    // Register success
    (async () => {
      if (register.isSuccess) {
        await userStore.setUser(register.data?.data?.data);
        navigate("/auth/email-sent", { state: { fromApp: true } });
      }

      // Register error
      if (register.isError) {
        toast({
          title: "Error",
          description: getErrorMsg(register),
          variant: "error",
          duration: 5000,
        });
      }

      // Login success
      if (login.isSuccess) {
        const responseData = login.data?.data?.data;

        // Check if 2FA is required
        if (
          login.data?.data?.message ===
          "User logged in successfully but pending 2FA"
        ) {
          setIs2FARequired(true);
          toast({
            title: "2FA Required",
            description:
              "Please authenticate with your security key to complete login.",
            variant: "default",
            duration: 5000,
          });
        } else {
          // Normal login flow
          const isVerified = responseData?.user?.isVerified;
          const userId = responseData?.user?._id;
          await userStore.setUser(responseData?.user);
          if (isVerified) {
            navigate(`/dashboard?uid=${userId}`);
          } else {
            navigate("/auth/email-sent", { state: { fromApp: true } });
          }
        }
      }

      // Login error
      if (login.isError) {
        toast({
          title: "Error",
          description: getErrorMsg(login),
          variant: "error",
          duration: 5000,
        });
      }
    })();
  }, [register.submittedAt, login.submittedAt]);

  //@handling oauth
  const getStatus = searchParams.get("status");
  const getOauthUser = useApiGet({
    key: ["getOauthUser"],
    path: ApiRoutes.getUserDetails,
    enabled: false,
  });
  useEffect(() => {
    if (
      getStatus === "User logged in successfully" ||
      getStatus === "User registered successfully"
    ) {
      getOauthUser.refetch();
      if (getOauthUser.isFetched) {
        if (getOauthUser.isSuccess) {
          (async () => {
            await userStore.setUser(getOauthUser.data?.data?.data);
          })();
          navigate(`/dashboard?uid=${getOauthUser.data?.data?.data?._id}`);
        } else if (getOauthUser.isError) {
          toast({
            title: "Error",
            description: getErrorMsg(getOauthUser),
            variant: "error",
            duration: 5000,
          });
        }
      }
    }
  }, [getStatus, getOauthUser.dataUpdatedAt, toast]);

  useEffect(() => {
    (async () => {
      const user = await userStore.getUser();
      const encrypted = sessionStorage.getItem("User");
      const encryptedUser = JSON.parse(encrypted as string).state.user;
      if (user && encryptedUser) {
        if (user._id === getOauthUser.data?.data?.data?._id) {
          toast({
            title: "Success",
            description: "You are logged in successfully",
            variant: "success",
            duration: 5000,
          });
          if (getOauthUser.data?.data?.data?.isVerified) {
            navigate(`/dashboard?uid=${user._id}`);
          } else {
            navigate("/auth/email-sent", { state: { fromApp: true } });
          }
        }
      }
    })();
  }, [userStore, navigate, toast]);

  // Render 2FA authentication screen
  if (is2FARequired) {
    navigate("/user/auth/additional-safety/2fa?mode=login&action=enable", {
      state: {
        fromApp: true,
        loginRequired: true,
        challenge: login.data?.data.data.challenge,
      },
    });
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-center items-center h-dvh w-full relative text-white perspective-distant overflow-hidden p-4 md:p-8">
        <div
          className={`relative transition-all duration-500 ease-in-out transform-3d w-full md:w-1/2 ${validMode === "login" ? "rotate-y-180" : ""} flex justify-center items-center`}
        >
          {/* Sign Up Side */}
          <div className="absolute w-full h-full backface-hidden flex justify-center items-center">
            <div className="bg-black rounded-2xl w-[90%] md:w-[80%] min-h-[90%] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-center">
                Create to your account
              </h1>
              <p className="text-sm text-muted-foreground flex justify-center items-center w-full mt-2">
                <span className="w-[30%] h-0.5 border-b-muted-foreground border-b-2 mx-2" />
                Or continue with
                <span className="w-[30%] h-0.5 border-b-muted-foreground border-b-2 mx-2" />
              </p>
              <ul className="w-full flex justify-center gap-4 py-4">
                <li>
                  <a href={`${config.BackendUrl}/users/oauth?provider=google`}>
                    <AiFillGoogleCircle className="text-4xl text-muted-foreground hover:scale-110" />
                  </a>
                </li>
                <li>
                  <a href={`${config.BackendUrl}/users/oauth?provider=github`}>
                    <AiOutlineGithub className="text-4xl text-muted-foreground hover:scale-110" />
                  </a>
                </li>
              </ul>
              <div className="w-full">
                <Form {...signUpForm}>
                  <form
                    onSubmit={signUpForm.handleSubmit(onSignuUpSubmit)}
                    className="space-y-6"
                  >
                    <FormFieldComp
                      form={signUpForm}
                      name="username"
                      labelValue="Username"
                      descriptionValue="Enter your username"
                      placeholderValue="John Doe"
                    />
                    <FormFieldComp
                      form={signUpForm}
                      name="email"
                      labelValue="Email"
                      descriptionValue="Enter your email"
                      placeholderValue="example@gmail.com"
                      type="email"
                    />

                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="********" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your password.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="********" {...field} />
                          </FormControl>
                          <FormDescription>
                            Confirm your Password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={register.isPending}
                      className="w-full"
                    >
                      Submit
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Already have an account?{" "}
                      <span
                        className={`text-secondary-foreground hover:underline ${register.isPending ? "cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={
                          !register.isPending ? switchToLogin : undefined
                        }
                      >
                        Login
                      </span>
                    </p>
                  </form>
                </Form>
              </div>
            </div>
          </div>
          {/* Login Side */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex justify-center items-center">
            <div className="bg-black rounded-2xl w-[90%] md:w-[80%] min-h-[90%] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
              <h1 className="text-4xl font-bold text-muted-foreground text-center">
                Welcome Back !
              </h1>
              <h2 className="text-2xl font-bold text-center">
                Login to your account
              </h2>
              <p className="text-sm text-muted-foreground flex justify-center items-center w-full mt-2">
                <span className="w-[30%] h-0.5 border-b-muted-foreground border-b-2 mx-2" />
                Or continue with
                <span className="w-[30%] h-0.5 border-b-muted-foreground border-b-2 mx-2" />
              </p>
              <ul className="w-full flex justify-center gap-4 py-4">
                <li>
                  <a href={`${config.BackendUrl}/users/oauth?provider=google`}>
                    <AiFillGoogleCircle className="text-4xl text-muted-foreground hover:scale-110" />
                  </a>
                </li>
                <li>
                  <a href={`${config.BackendUrl}/users/oauth?provider=github`}>
                    <AiOutlineGithub className="text-4xl text-muted-foreground hover:scale-110" />
                  </a>
                </li>
              </ul>
              <div className="w-full">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-6"
                  >
                    <FormFieldComp
                      form={loginForm}
                      name="username"
                      labelValue="Username"
                      descriptionValue="Enter your username"
                      placeholderValue="John Doe"
                    />
                    <p className="text-sm text-muted-foreground flex justify-center items-center w-full">
                      <span className="w-1/2 border-b-2 border-muted-foreground mx-2" />
                      OR
                      <span className="w-1/2 border-b-2 border-muted-foreground mx-2" />
                    </p>
                    <FormFieldComp
                      form={loginForm}
                      name="email"
                      labelValue="Email"
                      descriptionValue="Enter your email"
                      placeholderValue="example@gmail.com"
                      type="email"
                    />
                    <div className="relative w-full flex justify-end flex-col">
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <PasswordInput
                                placeholder="********"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter your password.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <ForgotPassword />
                    </div>
                    <Button
                      type="submit"
                      disabled={login.isPending}
                      className="w-full"
                    >
                      Submit
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Don't have an account?{" "}
                      <span
                        className={`text-secondary-foreground hover:underline ${login.isPending ? "cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={!login.isPending ? switchToSignup : undefined}
                      >
                        Signup
                      </span>
                    </p>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>

        {/* Side Image */}
        <div className="hidden md:flex relative bg-muted w-full md:w-1/2 h-[97%] rounded-2xl justify-center items-center">
          <img
            src="https://letshost.imgix.net/assets/logo.png?fm=webp"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9] cursor-pointer"
          />
        </div>
      </div>
    </>
  );
}

export default Auth;
