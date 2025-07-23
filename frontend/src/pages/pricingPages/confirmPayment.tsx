import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import animation from "@/../lottie/verify.json";
function ConfirmPayment() {
    const navigate = useNavigate();
  return (
     <>
      <div className="w-full h-dvh flex justify-center items-center bg-zinc-950 flex-col overflow-hidden">
        <Lottie
          animationData={animation}
          loop={true}
          style={{ width: "100%", height: "80%" }}
        />
        <Button
          className=" h-10 bg-primary text-white rounded-2xl cursor-pointer px-18 py-8 font-extrabold text-2xl"
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>
    </>
  )
}
export default ConfirmPayment