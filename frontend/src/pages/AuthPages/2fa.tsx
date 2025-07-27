import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card-hover-effect';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import {
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import {
  z
} from "zod"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  PasswordInput
} from "@/components/ui/password-input"
import { useApiPost } from "@/hooks/apiHooks"
import ApiRoutes  from "@/connectors/api-routes"
import  useUser  from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { getErrorMsg } from '@/lib/getErrorMsg';
import {  useState } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { useLocation, useNavigate , useSearchParams} from 'react-router-dom';
import { useUserStore } from '@/store/store';

const formSchema = z.object({
  password: z.string()
            .min(8, "Password must be at least 8 characters")
            .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
  confirmPassword: z.string()
  .min(8, "Password must be at least 8 characters"),
})
.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    }
  });

function TwoFA() {
     const form = useForm < z.infer < typeof formSchema >> ({
    resolver: zodResolver(formSchema),
  })
  const  user  = useUser();
  const [show2FASetup, setShow2FASetup] =useState(false);
  const [password, setPassword] = useState("");
  const [isProcessing2FA, setIsProcessing2FA] = useState(false);
  const [searchParams] = useSearchParams();

  
  const initialize2FA = useApiPost({
    type: "post",
    key: ["initialize2FA"],
    path: ApiRoutes.initialize2FA,
    sendingFile: false,

  });
  
  const verify2FA = useApiPost({
    type: "post",
    key: ["verify2FA"],
    path: ApiRoutes.verify2FA,
    sendingFile: false,
   
  });
  
  const checkPassword = useApiPost({
    type: "post",
    key: ["checkPassword"],
    path: ApiRoutes.checkPassword,
    sendingFile: false,
  });
  
  const disable2FA = useApiPost({
    type: "post",
    key: ["disable2FA"],
    path: ApiRoutes.disable2FA,
    sendingFile: false,

  });
  
  const TwoFALogin = useApiPost({
    type: "post",
    key: ["TwoFALogin"],
    path: ApiRoutes.verify2FALogin,
    sendingFile: false,

  });

  const {toast} = useToast();
  const navigate = useNavigate();
  const userStore = useUserStore();
  const location=useLocation();
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const PasswordResponse = await checkPassword.mutateAsync({
        password: values.password
      });
      
      // Check the response directly, not checkPassword.data
      if (PasswordResponse.data.data.status === true) {
        setShow2FASetup(true);
        setPassword(values.password);
        form.reset({
          password: "",
          confirmPassword: ""
        });
      } else {
        toast({
          title: "Error",
          description: "Password is incorrect",
          variant: "error",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: getErrorMsg(checkPassword),
        variant: "error",
        duration: 5000,
      });
    }
  }

  const handle2FAAuthentication = async () => {
    setIsProcessing2FA(true);
    try {
      const TwoFAdata = await initialize2FA.mutateAsync({
        password: password
      });
      const TwoFAOptions = TwoFAdata.data.data;
      
      const UserResponse = await startRegistration(TwoFAOptions);
      
      const verify2FAResponse = await verify2FA.mutateAsync({
        cred: UserResponse
      });
      
      if (verify2FAResponse.status === 200) {
        toast({
          title: "Success",
          description: "2FA initialized successfully",
          variant: "success",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        userStore.updateUser({
          TwoFAEnabled: true,
        })
        navigate(`/dashboard?user=${user?._id}&page=Settings`);
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(verify2FA),
          variant: "error",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        userStore.updateUser({
          TwoFAEnabled: false,
        })
        navigate(`/dashboard?user=${user?._id}&page=Settings`);
      }
    } catch (error) {
      console.error("Error in 2FA authentication:", error);
      toast({
        title: "Error",
        description: "Failed to set up 2FA. Please try again.",
        variant: "error",
        duration: 5000,
      });
      setIsProcessing2FA(false);
      setShow2FASetup(false);
    }
  }   

  // User-triggered cancel function
  async function cancel2FA() {

    if (initialize2FA.isPending) {
      (initialize2FA as any).cancel();
    }
    if (verify2FA.isPending) {
      (verify2FA as any).cancel();
    }
    if (checkPassword.isPending) {
      (checkPassword as any).cancel();
    }
    if (disable2FA.isPending) {
      (disable2FA as any).cancel();
    }
    if (TwoFALogin.isPending) {
      (TwoFALogin as any).cancel();
    }
    
    // Reset states
    setIsProcessing2FA(false);
    setShow2FASetup(false);
    setPassword("");
    
    // Show cancellation toast only for user-triggered cancels
    toast({
      title: "Cancelled",
      description: "2FA setup has been cancelled",
      variant: "default",
      duration: 3000,
    });
    
    // Navigate back to settings
    navigate(`/dashboard?user=${user?._id}&page=Settings`);
  }

  const handleDisable2FA = async () => {
    setIsProcessing2FA(true);
    try {
      const disable2FAResponse = await disable2FA.mutateAsync({
        password: password
      });
      
      if (disable2FAResponse.status === 200) {
        toast({
          title: "Success",
          description: "2FA disabled successfully",
          variant: "success",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        userStore.updateUser({
          TwoFAEnabled: false,
        });
        navigate(`/dashboard?user=${user?._id}&page=Settings`);
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(disable2FA),
          variant: "error",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        userStore.updateUser({
          TwoFAEnabled: true,
        });
        navigate(`/dashboard?user=${user?._id}&page=Settings`);
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
        variant: "error",
        duration: 5000,
      });
      setIsProcessing2FA(false);
      setShow2FASetup(false);
      userStore.updateUser({
        TwoFAEnabled: true,
      });
      navigate(`/dashboard?user=${user?._id}&page=Settings`);
    }
  };

  const handle2FALogin = async () => {
    setIsProcessing2FA(true);
    try {
      const challenge=location.state?.challenge ;
      if (!challenge) {
        throw new Error("Challenge not found");
      }
      const userAnswer=await startAuthentication({optionsJSON: challenge});
      const TwoFAdata = await TwoFALogin.mutateAsync({
        cred: userAnswer,
      });
      
      if (TwoFAdata.status === 200) {
        toast({
          title: "Success",
          description: "2FA Login successful",
          variant: "success",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        await userStore.setUser(TwoFAdata.data.data);
        navigate(`/dashboard?user=${user?._id}&page=Settings`);
      } else {
        toast({
          title: "Error",
          description: getErrorMsg(TwoFALogin),
          variant: "error",
          duration: 5000,
        });
        setIsProcessing2FA(false);
        setShow2FASetup(false);
        navigate(`/auth?mode=login`);
      }
    } catch (error) {
      console.error("Error in 2FA login:", error);
      toast({
        title: "Error",
        description: "Failed to login with 2FA. Please try again.",
        variant: "error",
        duration: 5000,
      });
      setIsProcessing2FA(false);
      setShow2FASetup(false);
      navigate(`/auth?mode=login`);
    }
  };

  if(show2FASetup && searchParams.get("mode") === "register" && searchParams.get("action")==="enable") {
    return(
      <>
       <div className="flex justify-center items-center h-dvh w-full relative text-white overflow-hidden p-4 md:p-8">
              <div className="bg-black rounded-2xl w-[90%] md:w-[400px] min-h-[400px] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
                <FaShieldAlt className="text-6xl text-blue-500 mb-6" />
                <h1 className="text-2xl font-bold text-center mb-4">
                  Two-Factor Authentication
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  Please authenticate with your security key to register your passkey.
                </p>
                
                <div className="w-full space-y-4">
                  <Button
                    onClick={handle2FAAuthentication}
                    disabled={isProcessing2FA}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing2FA ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Registering.......
                      </div>
                    ) : (
                      "Register your Passkey"
                    )}
                  </Button>
                  
                  <Button
                    onClick={cancel2FA}
                    disabled={isProcessing2FA}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Make sure your security key is connected and ready to use.
                </p>
              </div>
            </div>
      </>
    )
  }

  if(searchParams.get("mode") === "login" && searchParams.get("action")==="enable") {
    return(
      <>
       <div className="flex justify-center items-center h-dvh w-full relative text-white overflow-hidden p-4 md:p-8">
              <div className="bg-black rounded-2xl w-[90%] md:w-[400px] min-h-[400px] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
              <FaShieldAlt className="text-6xl text-blue-500 mb-6" />
              <h1 className="text-2xl font-bold text-center mb-4">
                  Two-Factor Authentication
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-8">
                  Please authenticate with your security key to login.
              </p>
              
              <div className="w-full space-y-4">
                  <Button
                  onClick={handle2FALogin}
                  disabled={isProcessing2FA}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                  {isProcessing2FA ? (
                      <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Logging in.......
                      </div>
                  ) : (
                      "Login with Passkey"
                  )}
                  </Button>
                  
                  <Button
                  onClick={cancel2FA}
                  disabled={isProcessing2FA}
                  variant="outline"
                  className="w-full"
                  >
                  Cancel
                  </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-6">
                  Make sure your security key is connected and ready to use.
              </p>
              </div>
          </div>
      </>
    )
  }

  if(show2FASetup && searchParams.get("action")==="disable") {
    return(
      <>
      <div className="flex justify-center items-center h-dvh w-full relative text-white overflow-hidden p-4 md:p-8">
          <div className="bg-black rounded-2xl w-[90%] md:w-[400px] min-h-[400px] flex flex-col justify-center items-center shadow-2xl p-6 sm:p-8">
          <FaShieldAlt className="text-6xl text-blue-500 mb-6" />
          <h1 className="text-2xl font-bold text-center mb-4">
              Two-Factor Authentication
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
              Two factor authentication is currently enabled. It is recommended to disable it only if you are sure you want to remove this extra layer of security. You can re-enable it later.
          </p>
          <Button
          onClick={handleDisable2FA}
          disabled={isProcessing2FA}
          className="w-full mb-4"
          >
            {isProcessing2FA ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Disabling.......
              </div>
            ) : (
              "Disable Two Factor Authentication"
            )}
          </Button>
          <Button
            onClick={cancel2FA}
            disabled={isProcessing2FA}
            variant="outline"
            className="w-full"
          > 
            Cancel
          </Button>
          </div>
       </div>
      </>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen">
    <Card className="border-2 shadow-lg w-full max-w-xl  ">
        <CardHeader className=" text-primary">
         <CardTitle className="text-2xl font-bold text-center p-0">
               <h1 className="text-3xl font-bold">Two Factor Authentication</h1>
         </CardTitle>
        <CardDescription className='p-0 m-0 text-center text-sm'>
            Enable Two Factor Authentication for added security.
        </CardDescription>
        </CardHeader>
      <CardContent className="p-4">
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        
        <FormField
          control={form.control}
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
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormDescription>Confirm Your Password</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>Submit</Button>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-4"
          onClick={cancel2FA}
        >
            Cancel
        </Button>
      </form>
    </Form>
        </CardContent>
    </Card>
    </div>
  )
}

export default TwoFA