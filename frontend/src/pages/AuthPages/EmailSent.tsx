import Lottie from "lottie-react";
import animation from "../../../lottie/emailSent.json";
import { Button } from "@/components/ui/button";
import { useApiGet } from "@/hooks/apiHooks";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import ApiRoutes from "@/connectors/api-routes";
function EmailSent() {
  const [fetched, setFetched] = useState(false);
  const { toast } = useToast();
  const resend = useApiGet({
    key: ["resendEmail"],
    path: ApiRoutes.resendVerificationToken,
    enabled: fetched,
  });
  const handleResendEmail = () => {
    setFetched(true);
  };
  useEffect(() => {
    if (resend.isFetched) {
      toast({
        title: resend.isSuccess
          ? "Email sent successfully"
          : "Error sending email Please try again later",
        description: resend.isSuccess
          ? "Please check your inbox for verification email"
          : getErrorMsg(resend),
        duration: 5000,
        variant: resend.isSuccess ? "success" : "error",
      });
    }

    return () => {};
  }, [resend.isFetched, toast]);

  return (
    <div className="w-full h-dvh flex justify-center items-center bg-background flex-col overflow-hidden">
      <div className="w-64 h-64">
        <Lottie
          animationData={animation}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="w-full h-1/3 flex justify-center items-center flex-col">
        <h1 className="text-3xl p-4 font-extrabold">Email sent successfully</h1>
        <h2 className="text-2xl p-2 font-semibold text-muted-foreground text-center">
          Please check your inbox for verification email
        </h2>
        <h2 className="text-md p-2 font-semibold text-accent text-center">
          If you did not receive verification email, please check your spam
          folder
        </h2>
      </div>
      <div>
        <Button
          className="w-full h-10 bg-secondary text-white rounded-2xl cursor-pointer p-8"
          onClick={handleResendEmail}
          disabled={resend.isFetching}
        >
          Resend Email
        </Button>
      </div>
    </div>
  );
}

export default EmailSent;
