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

const stripePromise = loadStripe(
  "pk_test_51RT02YQNakd5vzwzc5ucip489H1fKro3v44yBP7PVvcI301spBUUF6BgJIxYitImN46KoOrTkOC442tm2rZOZ4oI007Lb8wsCH",
);

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
      payment.mutate({ planType });
    }
  }, [planType]);

  useEffect(() => {
    if (payment.isError) {
      toast({
        title: "Error",
        description: getErrorMsg(payment),
        variant: "error",
        duration: 5000,
      });
    }

    if (payment.isSuccess && payment.data.data?.data?.client_secret) {
      setClientSecret(payment.data.data.data.client_secret);
    }
  }, [payment.isError, payment.isSuccess]);

  if (!clientSecret) {
    return <div className="w-dvh h-dvh"></div>;
  }

  const options = { clientSecret };

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
};

export default Pay;
