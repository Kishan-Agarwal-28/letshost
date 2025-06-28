import Stripe from "stripe";
import { Payment } from "../models/payment.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { APPURL } from "../constants.js";
const stripe = new Stripe(process.env.STRIPE_SECRET);

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
    return_url: `${APPURL}/payment/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
  });
  return res
    .status(200)
    .json(
      new apiResponse(200, session, "Payment session created successfully")
    );
});
export { MakePayment };
