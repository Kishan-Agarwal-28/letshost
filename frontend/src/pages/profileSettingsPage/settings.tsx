import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { User, Mail, Lock, Trash2, Camera, Shield } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApiPost, useApiGet } from "@/hooks/apiHooks";
import ApiRoutes from "@/connectors/api-routes";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useSearchParams } from "react-router-dom";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import { useUserStore } from "@/store/store";
import FormFieldComp from '@/pages/AuthPages/FormFieldComp';

import useUser from '@/hooks/useUser';
import { AvatarCircles } from '@/components/magicui/avatar-circles';
import { FaGoogle, FaGithub } from 'react-icons/fa6';
import type { JSX } from 'react/jsx-runtime';
import CompactFileUploader from '../cdnPages/compactFileUploader';

function SettingsPage() {
 const user=useUser()
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [showPasswordForm, setShowPasswordForm] = useState(false);
const [username, setUsername] = useState<string>("");
const [email, setEmail] = useState<string>("");
useEffect(() => {
    if(user){
        setUsername(user.username);
        setEmail(user.email);
    }
},[user]);
const [searchParams] = useSearchParams({ token: "" });
useEffect(() => {
    if (searchParams.get("token")) {
      setShowPasswordForm(true);
    }
    else{
        setShowPasswordForm(false);
    }
},[searchParams]);
  const changePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        ),
      confirmPassword: z.string()
      .min(8, "Password must be at least 8 characters long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        )

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
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { errors } = changePasswordForm.formState;
const {toast}=useToast();

const RequestPasswordChangeEmail=useApiPost({
    type:"post",
    key:["requestPasswordChangeEmail"],
    path:ApiRoutes.sendUpdatePasswordEmail,
    sendingFile:false
})
const handlePasswordChangeRequestEmail = async() => {
    if(user?.email==null) return;
  const data=await RequestPasswordChangeEmail.mutateAsync({
    email:user.email
  });
  if(data.status===200){
    toast({
      title: "Email sent",
      description: "Check your email for the reset link.",
      variant: "success",
      duration: 5000,
    });
  }
  else{
    toast({
      title: "Error",
      description: getErrorMsg(RequestPasswordChangeEmail),
      variant: "error",
      duration: 5000,
    });
  }
};

const updatePassword=useApiPost({
    type:"post",
    key:["updatePassword"],
    path:ApiRoutes.updatePassword,
    sendingFile:false
})

const logout=useApiGet({
    key:["logout"],
    path:ApiRoutes.logout,
    enabled:false
})
const userStore=useUserStore();

const onChangePasswordSubmit = async(data: z.infer<typeof changePasswordSchema>) => {
    const res=await updatePassword.mutateAsync({
      verificationToken:searchParams.get("token"),
      newPassword:data.password,
      oldPassword:data.currentPassword
    });
    if(res.status===200){
      toast({
        title: "Password updated",
        description: "Please login with your new password",
        variant: "success",
        duration: 5000,
      });
     logout.refetch();
     userStore.deleteUser();
    }
    else{
      toast({
        title: "Error",
        description: getErrorMsg(updatePassword),
        variant: "error",
        duration: 5000,
      });
    }
  };

  const changeUsername=useApiPost({
    type:"post",
    key:["changeUsername"],
    path:ApiRoutes.changeUserName,
    sendingFile:false
})
const changeEmail=useApiPost({
    type:"post",
    key:["changeEmail"],
    path:ApiRoutes.changeEmail,
    sendingFile:false
})
const getuser=useApiGet({
    key:["getUser"],
    path:ApiRoutes.getUserDetails,
    enabled:false
})
const RequestEmailChange=useApiGet({
  key:["RequestChangeEmail"],
  path:ApiRoutes.changeEmail,
  enabled:false
})
const handleRequestChangeEmail=async()=>{
  const data=await RequestEmailChange.refetch()
  if(data.isSuccess){
    toast({
      title: "Email sent",
      description: "Check your email for the reset link.",
      variant: "success",
      duration: 5000,
    });
  }
  else{
    toast({
      title: "Error",
      description: getErrorMsg(RequestPasswordChangeEmail),
      variant: "error",
      duration: 5000,
    });
  }
};
const handleChangeUserDetails=async()=>{
    if(username===user?.username && email===user?.email){
      return;
    }
    else if(username!==user?.username && email===user?.email){
    const data=await changeUsername.mutateAsync({
      username:username
    });
    if(data.status===200){
      toast({
        title: "Username updated",
        description: "Username updated successfully",
        variant: "success",
        duration: 5000,
      });
      getuser.refetch();
    }
    else{
      toast({
        title: "Error",
        description: getErrorMsg(changeUsername),
        variant: "error",
        duration: 5000,
      });
    }
}
else if(username===user?.username && email!==user?.email){
  const data=await changeEmail.mutateAsync({
    verificationToken:searchParams.get("token"),
    email:email
  });
  if(data.status===200){
    toast({
      title: "Email updated",
      description: "Email updated successfully",
      variant: "success",
      duration: 5000,
    });
    getuser.refetch();
  }
  else{
    toast({
      title: "Error",
      description: getErrorMsg(changeUsername),
      variant: "error",
      duration: 5000,
    });
  }
}
else if(username!==user?.username && email!==user?.email){
  const data=await changeUsername.mutateAsync({
    username:username,
  });
  const res=await changeEmail.mutateAsync({
    verificationToken:searchParams.get("token"),
    email:email
  });
  if(data.status===200 && res.status===200){
    toast({
      title: "Username and Email updated",
      description: "Username and Email updated successfully",
      variant: "success",
      duration: 5000,
    });
    getuser.refetch();
  }
  else if(data.status===200){
    toast({
      title: "Username updated",
      description: "Username updated successfully",
      variant: "success",
      duration: 5000,
    });
    getuser.refetch();
  }
  else if(res.status===200){
    toast({
      title: "Email updated",
      description: "Email updated successfully",
      variant: "success",
      duration: 5000,
    });
    getuser.refetch();
  }
  else{
    toast({
      title: "Error",
      description: getErrorMsg(changeUsername).concat(getErrorMsg(changeEmail)),
      variant: "error",
      duration: 5000,
    });
  }

}   
  };

const IconComponent:Record<string,JSX.Element>={
  "google":<FaGoogle className='h-4 w-4'/>,
  "github":<FaGithub className='h-4 w-4'/>,
}
const providers=[
        {
          providerName: "google",
          connected:user?.oauth?.providers.find((provider)=>provider.providerName==="google")?true:false
        },
        {
          providerName: "github",
          connected:user?.oauth?.providers.find((provider)=>provider.providerName==="github")?true:false
        }
      ]

const handleProviderConnect=async()=>{
 const data= await logout.refetch();
 if(data.isSuccess){
  toast({
    title: "Success",
    description: "You have successfully logged out Please login with provider to connect",
    variant: "success",
    duration: 5000,
  });
  userStore.deleteUser();
 }
 else{
  toast({
    title: "Error",
    description: "Could not connect to provider",
    variant: "error",
    duration: 5000,
  });
 }

}
const deleteUser=useApiPost({
  type:"delete",
  key:["deleteUser"],
  path:ApiRoutes.deleteUser,
  sendingFile:false
})
const handleDeleteAccount=async()=>{
  const data=await deleteUser.mutateAsync({});
  if(data.status===200){
    toast({
      title: "Success",
      description: "Account deleted successfully",
      variant: "success",
      duration: 5000,
    });
    userStore.deleteUser();
  }
  else{
    toast({
      title: "Error",
      description: getErrorMsg(deleteUser),
      variant: "error",
      duration: 5000,
    });
  }
}
  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-slate-600/80 bg-clip-text text-transparent p-2">
            Account Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Manage your profile and account preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
          <div className="lg:col-span-2 space-y-6">
           
            <Card className="border-0 shadow-lg bg-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="flex items-center gap-6">
                  <div className="relative group flex items-center justify-center">
                    <Dialog>
                    <DialogTrigger className='cursor-pointer'>
                    <AvatarCircles numPeople={0} avatarUrls={[{ imageUrl: user?.avatar ||"" }]} className="h-24 w-24 border-4 flex items-center justify-center rounded-2xl shadow-lg" />
                    </DialogTrigger>
                     <DialogContent>
                      <img src={user?.avatar} alt="avatar" className='w-full h-full object-cover rounded-xl'/>
  </DialogContent>
                    </Dialog>
                    <Dialog>
  <DialogTrigger> <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-120 cursor-pointer "
                      // onClick={handleAvatarChange}
                    >
                      <Camera className="h-4 w-4 cursor-pointer" />
                    </Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update Avatar</DialogTitle>
      <DialogDescription>
        Choose a image to update your avatar
      </DialogDescription>
    </DialogHeader>
    <CompactFileUploader
    allowedFileType='image'
    purpose='avatarUpdate'
    />
  </DialogContent>
</Dialog>
                  </div>
                  <div className="space-y-1 flex w-full items-center justify-around gap-3">
                    <h3 className="text-xl font-semibold">
                        <span className='text-muted-foreground mx-4'>Username : </span>
                        {user?.username}</h3>
                    <div className='flex items-center gap-2'>
                        <Badge className="text-slate-400 bg-background px-4 py-1" variant={"secondary"}>
                            {user?.tier}
                            </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Shield className="h-3 w-3 mr-1" />
                      {user?.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                    value={username}
                    defaultValue={user?.username}
                    placeholder={user?.username}
                    onChange={(e) => setUsername(e.target.value)}
                      className="bg-white/50 dark:bg-slate-700/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email}
                      value={email}
                      placeholder={user?.email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/50 dark:bg-slate-700/50"
                      disabled={searchParams.get("token")?.toString()?false:true}
                    />
                    <Button variant={"ghost"} onClick={handleRequestChangeEmail}>
                        <Mail className="h-4 w-4" />
                        Request Email Change
                    </Button>
                  </div>
                </div>

                <Button onClick={handleChangeUserDetails} className="bg-gradient-to-r from-gray-600 to-zinc-600 hover:from-zinc-700 hover:to-gray-700" disabled={changeUsername.isPending}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-0 shadow-lg bg-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {showPasswordForm?
                (<Form {...changePasswordForm}>
                    <form onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <FormFieldComp
                        form={changePasswordForm}
                        name="currentPassword"
                        labelValue="Current Password"
                        descriptionValue="Enter your current password"
                        placeholderValue="Current Password"
                        type="password"
                      />
                    </div>
                  </div>
                  

                 
                  <div className="space-y-2">
                    <FormFieldComp
                        form={changePasswordForm}
                        name="OTP"
                        labelValue="OTP"
                        descriptionValue="Automatically entered from url "
                        placeholderValue="OTP"
                        type="password"
                        value={searchParams.get("token")?.toString()}
                        enabled={false}
                      />
                  </div>
                </div>
 <div className="relative">
                      <FormFieldComp
                        form={changePasswordForm}
                        name="password"
                        labelValue="Password"
                        descriptionValue="Enter your Password"
                        placeholderValue="Password"
                        type={showPassword ? "text" : "password"}
                        className='w-full'
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground ${errors.password?"-translate-y-6/5":""}`}
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
                        type={showConfirmPassword ? "text" : "password"}
                        className='w-full'
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground ${errors.confirmPassword?"-translate-y-6/5":""}`}
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash size={20} />
                        ) : (
                          <FaEye size={20} />
                        )}
                      </button>
                    </div>
               
                <Button type='submit' variant="outline" className="border-blue-200 hover:bg-blue-50" disabled={updatePassword.isPending}>
                  Update Password
                </Button>
                </form>
                </Form>)
                :
                (
  <div className="relative h-[300px] flex items-center justify-center rounded-md overflow-hidden">
    {/* Overlay blur layer */}
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
      
      <Lock className="h-10 w-10 text-slate-600 dark:text-slate-300 mb-4" />

     
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
        Password change is locked
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        You must request a email link to change your password.
      </p>

      {/* Request button */}
      <Button variant="outline" onClick={handlePasswordChangeRequestEmail} className="w-full flex" disabled={RequestPasswordChangeEmail.isPending}>
        Request Email
      </Button>
    </div>

    {/* Background layer for styling */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-900 opacity-30" />
  </div>
)
                    }
              </CardContent>
              
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            <Card className="border-0 shadow-lg bg-card backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Connected Accounts</CardTitle>
                <CardDescription>
                  Manage your OAuth provider connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {providers.map((provider) => {
                  
                  return (
                    <div key={provider.providerName} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                          {IconComponent[provider.providerName]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{provider.providerName}</p>
                          
                        </div>
                      </div>
                     <Badge
  variant={provider.connected ? "default" : "secondary"}
  className="text-xs"
  onClick={!provider.connected ? handleProviderConnect : undefined}
>
  {provider.connected ? "Connected" : "Connect"}
</Badge>

                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800 shadow-lg bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
                  <div className="text-red-700 dark:text-red-400 text-sm">
                    Once you delete your account, there is no going back. This action cannot be undone.
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;