import { useState, useEffect, useCallback, useRef } from "react";
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
import { useOffline } from "@/hooks/use-offline";

function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isOffline = useOffline();
  const [searchParams, setSearchParams] = useSearchParams({
    mode: "signup",
    status: "",
  });

  const userStore = useUserStore();
  const [is2FARequired, setIs2FARequired] = useState(false);
  
  // Add refs to track if effects have run to prevent infinite loops
  const registerProcessedRef = useRef(false);
  const loginProcessedRef = useRef(false);
  const oauthProcessedRef = useRef(false);
  const userCheckProcessedRef = useRef(false);

  // Schemas
  const signUpSchema = z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .regex(
          /^[a-zA-Z0-9]+$/,
          "Username can only contain letters and numbers"
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
          /^[a-zA-Z0-9]+$/,
          "Username can only contain letters and numbers"
        )
        .refine((val) => !val.includes(" "), "Username cannot contain spaces")
        .or(z.literal("")),
      email: z
        .string()
        .or(z.literal(""))
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
  const validMode = modeParam === "login" || modeParam === "signup" ? modeParam : "signup";
  
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

  // Memoized switch functions to prevent unnecessary re-renders
  const switchToLogin = useCallback(() => {
    setSearchParams({ mode: "login" });
    signUpForm.reset();
    setIs2FARequired(false);
    registerProcessedRef.current = false;
    loginProcessedRef.current = false;
  }, [setSearchParams, signUpForm]);

  const switchToSignup = useCallback(() => {
    setSearchParams({ mode: "signup" });
    loginForm.reset();
    setIs2FARequired(false);
    registerProcessedRef.current = false;
    loginProcessedRef.current = false;
  }, [setSearchParams, loginForm]);

  // API hooks
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

  const getStatus = searchParams.get("status");
  const getOauthUser = useApiGet({
    key: ["getOauthUser"],
    path: ApiRoutes.getUserDetails,
    enabled: false,
  });

  // Submit handlers
  const onSignuUpSubmit = useCallback((data:z.infer<typeof signUpSchema>) => {
    registerProcessedRef.current = false;
    register.mutate(data);
  }, [register]);

  const onLoginSubmit = useCallback((data:z.infer<typeof loginSchema>) => {
    loginProcessedRef.current = false;
    login.mutate(data);
  }, [login]);

  // Handle register/login responses
  useEffect(() => {
    const handleAuthResponse = async () => {
      try {
        // Handle register success
        if (register.isSuccess && !registerProcessedRef.current) {
          registerProcessedRef.current = true;
          await userStore.setUser(register.data?.data?.data);
          navigate("/auth/email-sent", { state: { fromApp: true } });
          return;
        }

        // Handle register error
        if (register.isError && !registerProcessedRef.current) {
          registerProcessedRef.current = true;
          toast({
            title: "Error",
            description: getErrorMsg(register),
            variant: "error",
            duration: 5000,
          });
          return;
        }

        // Handle login success
        if (login.isSuccess && !loginProcessedRef.current) {
          loginProcessedRef.current = true;
          const responseData = login.data?.data?.data;

          // Check if 2FA is required
          if (login.data?.data?.message === "User logged in successfully but pending 2FA") {
            setIs2FARequired(true);
            toast({
              title: "2FA Required",
              description: "Please authenticate with your security key to complete login.",
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
          return;
        }

        // Handle login error
        if (login.isError && !loginProcessedRef.current) {
          loginProcessedRef.current = true;
          toast({
            title: "Error",
            description: getErrorMsg(login),
            variant: "error",
            duration: 5000,
          });
          return;
        }
      } catch (error) {
        console.error("Error handling auth response:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
          duration: 5000,
        });
      }
    };

    handleAuthResponse();
  }, [
    register.isSuccess,
    register.isError,
    login.isSuccess,
    login.isError,
    userStore,
    navigate,
    toast
  ]);

  // Handle OAuth flow
  useEffect(() => {
    const handleOAuth = async () => {
      if (
        (getStatus === "User logged in successfully" || getStatus === "User registered successfully") &&
        !oauthProcessedRef.current
      ) {
        oauthProcessedRef.current = true;
        
        try {
          const result = await getOauthUser.refetch();
          
          if (result.isSuccess) {
            await userStore.setUser(result.data?.data?.data);
          } else if (result.isError) {
            toast({
              title: "Error",
              description: getErrorMsg(result),
              variant: "error",
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("OAuth error:", error);
          toast({
            title: "Error",
            description: "Failed to authenticate with OAuth",
            variant: "error",
            duration: 5000,
          });
        }
      }
    };

    handleOAuth();
  }, [getStatus, getOauthUser, userStore, toast]);

  // Handle user verification after OAuth
  useEffect(() => {
    const handleUserVerification = async () => {
      if (getOauthUser.isSuccess && !userCheckProcessedRef.current) {
        userCheckProcessedRef.current = true;
        
        try {
          const user = await userStore.getUser();
          const encrypted = localStorage.getItem("User");
          
          if (encrypted) {
            const encryptedUser = JSON.parse(encrypted).state.user;
            
            if (user && encryptedUser && user._id === getOauthUser.data?.data?.data?._id) {
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
        } catch (error) {
          console.error("User verification error:", error);
        }
      }
    };

    handleUserVerification();
  }, [getOauthUser.isSuccess, getOauthUser.data, userStore, navigate, toast]);

  // Handle 2FA redirect
  useEffect(() => {
    if (is2FARequired) {
      navigate("/user/auth/additional-safety/2fa?mode=login&action=enable", {
        state: {
          fromApp: true,
          loginRequired: true,
          challenge: login.data?.data?.data?.challenge,
        },
      });
    }
  }, [is2FARequired, navigate, login.data]);

  return (
    <div className="flex flex-col md:flex-row justify-center items-center h-dvh w-full relative text-white perspective-distant overflow-hidden p-4 md:p-8">
      <div
        className={`relative transition-all duration-500 ease-in-out transform-3d w-full md:w-1/2 ${
          validMode === "login" ? "rotate-y-180" : ""
        } flex justify-center items-center`}
      >
        {/* Sign Up Side */}
        <div className="absolute w-full h-full backface-hidden flex justify-center items-center">
          <div className="bg-black rounded-2xl w-[90%] md:w-[80%] min-h-[90%] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-center">Create your account</h1>
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
                <form onSubmit={signUpForm.handleSubmit(onSignuUpSubmit)} className="space-y-6">
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
                        <FormDescription>Enter your password.</FormDescription>
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
                        <FormDescription>Confirm your Password</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={register.isPending} className="w-full">
                    {register.isPending ? "Creating Account..." : "Submit"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Already have an account?{" "}
                    <span
                      className={`text-secondary-foreground hover:underline ${
                        register.isPending ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                      onClick={!register.isPending ? switchToLogin : undefined}
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
            <h1 className="text-4xl font-bold text-muted-foreground text-center">Welcome Back!</h1>
            <h2 className="text-2xl font-bold text-center">Login to your account</h2>
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
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
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
                  <div className="relative w-full flex justify-end flex-col text-sm">
                    <FormField
                      control={loginForm.control}
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
                    <ForgotPassword />
                  </div>
                  <Button type="submit" disabled={login.isPending} className="w-full">
                    {login.isPending ? "Logging in..." : "Submit"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Don't have an account?{" "}
                    <span
                      className={`text-secondary-foreground hover:underline ${
                        login.isPending ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
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
          src={`${
            !isOffline
              ? "https://letshost.imgix.net/assets/logo.png?fm=webp"
              : "logo.png"
          }`}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9] cursor-pointer"
        />
      </div>
    </div>
  );
}

export default Auth;