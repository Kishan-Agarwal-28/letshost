import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useApiPost } from "@/hooks/apiHooks";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getErrorMsg } from "@/lib/getErrorMsg";
import config from "@/config/config";

const stripePromise = loadStripe(config.StripeKey);

const Pay = () => {
  const [searchParams] = useSearchParams({ planType: "monthly" });
  const planType = searchParams.get("planType");
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState(null);

  const payment = useApiPost({
    type: "post",
    path: "/users/payment",
    key: ["payment"],
  });

  useEffect(() => {
    if (planType) {
      ;(async()=>{
        const data= await payment.mutateAsync({ planType });
      if(data.status !== 200){
       toast({
        title: "Error",
        description: getErrorMsg(payment),
        variant: "error",
        duration: 5000,
      });
      }
      if (data.data?.data?.client_secret) {
        setClientSecret(data.data.data.client_secret);
      }
      })();
    }
  }, [planType]);

  if (!clientSecret) {
    return <div className="w-dvh h-dvh"></div>;
  }

  const options = { clientSecret };

  return (
    <>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </>
  );
};

export default Pay;
