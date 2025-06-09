import Stripe from "stripe";
import { Payment } from "../models/payment.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";

const stripe = new Stripe(
  "sk_test_51RT02YQNakd5vzwzQ2rMASK2NJTgaH0WfuaxTCKfKYqE2cfpAB5JebKdrkm4PkNOzBVVMY1oGqNPSG6PvEHy7ziJ006GwVSwLC"
);

const MakePayment = asyncHandler(async (req, res) => {
  const { planType } = req.body;
  if (!planType || (planType !== "monthly" && planType !== "yearly")) {
    throw new apiError(400, "Invalid plan type");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price:
          planType === "monthly"
            ? "price_1RT0YfQNakd5vzwzdqCHzktN"
            : "price_1RT0a7QNakd5vzwzUqzHpNnl",
        quantity: 1,
      },
    ],
    ui_mode: "embedded",
    return_url:
      "http://localhost:5173/payment/checkout/return?session_id={CHECKOUT_SESSION_ID}",
  });
  return res
    .status(200)
    .json(
      new apiResponse(200, session, "Payment session created successfully")
    );
});
export { MakePayment };
