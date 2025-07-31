import Lottie from "lottie-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useApiPost } from "@/hooks/apiHooks";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ApiRoutes from "@/connectors/api-routes";
import useUser from "@/hooks/useUser";
import { useUserStore } from "@/store/store";
import { useOffline } from "@/hooks/use-offline";
function EmailVerify() {
  const [searchParams] = useSearchParams({ token: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOffline = useOffline();
  const [verified, setVerified] = useState(false);
  const userStore = useUserStore();
  const user = useUser();
  const sendToken = useApiPost({
    key: ["verifyToken"],
    path: ApiRoutes.verify,
    type: "post",
  });
  const sendVerificationToken = () => {
    const data = {
      verificationToken: searchParams.get("token"),
    };
    sendToken.mutate(data);
  };
  useEffect(() => {
    (async () => {
      if (sendToken.isSuccess) {
        await userStore.updateUser({ isVerified: true });
        setVerified(true);
        toast({
          title: "Email verified successfully",
          description: "Please click on the button below to continue",
          duration: 5000,
          variant: "success",
        });
      }
      if (sendToken.isError) {
        toast({
          title: "Error",
          description: getErrorMsg(sendToken),
          duration: 5000,
          variant: "error",
        });
      }
    })();
    return () => {};
  }, [sendToken.submittedAt, toast]);

  const handleContinue = () => {
    if (verified) {
      navigate(`/dashboard?uid=${user?._id}`);
    }
  };
  const [verifyAnimationData, setVerifyAnimationData] = useState<any>(null);
  const [errorAnimationData, setErrorAnimationData] = useState<any>(null);
  useEffect(() => {
    fetch("/lottie/verify.json")
      .then((res) => res.json())
      .then((data) => setVerifyAnimationData(data))
      .catch((err) => console.error("Failed to load animation", err));
    fetch("/lottie/error.json")
      .then((res) => res.json())
      .then((data) => setErrorAnimationData(data))
      .catch((err) => console.error("Failed to load animation", err));
  }, []);

  return (
    <div className="w-full h-dvh flex justify-center items-center bg-background flex-col overflow-hidden">
      {verified ? (
        <div className="w-full h-dvh flex justify-center items-center bg-background flex-col overflow-hidden">
          <div className="w-64 h-64">
            <Lottie
              animationData={
                !sendToken.isError ? verifyAnimationData : errorAnimationData
              }
              loop={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="w-full h-1/3 flex justify-center items-center flex-col">
            <h1 className="text-3xl p-4 font-extrabold">
              {!sendToken.isError
                ? "Email verified successfully"
                : "Email cannot be verified"}
            </h1>
            <h2 className=" p-2 font-semibold text-muted-foreground">
              {!sendToken.isError
                ? "Please click on the button below to continue"
                : "Please try again later"}
            </h2>
          </div>
          <div>
            {!sendToken.isError && (
              <Button
                className="w-full h-10 bg-secondary text-white rounded-2xl cursor-pointer p-8"
                onClick={handleContinue}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center bg-background  overflow-hidden">
          <div className="w-1/2 h-64 flex justify-center items-center flex-col gap-8">
            <h2 className="text-2xl font-bold">
              Please verify your email to continue.
            </h2>
            <span className="text-muted-foreground ">
              Click below to verify your email.
            </span>
            <Button
              className="w-1/2 h-10 bg-secondary text-white rounded-2xl cursor-pointer p-6"
              onClick={sendVerificationToken}
            >
              Verify Email
            </Button>
          </div>
          <div className="relative hidden bg-muted md:flex w-1/3 h-[90%] rounded-2xl justify-center items-center">
            <img
              src={`${!isOffline ? "https://letshost.imgix.net/assets/logo.png?fm=webp" : "logo.png"}`}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.9] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailVerify;
