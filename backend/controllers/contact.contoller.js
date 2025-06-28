import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Resend } from "resend";
const contact = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phoneNumber, message } = req.body;
  if (!firstName || !lastName || !email || !phoneNumber || !message) {
    throw new apiError(400, "All fields are required");
  } else {
    const data = {
      firstName,
      lastName,
      email,
      phoneNumber,
      message,
    };
    const admin = process.env.ADMIN_EMAIL;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const options = {
      from: "onboarding@letshost.dpdns.org",
      to: admin,
      subject: `Contact from ${firstName} ${lastName}`,
      html: `<h1>Contact from ${firstName} ${lastName}</h1><p>Email: ${email}</p><p>Phone Number: ${phoneNumber}</p><p>Message: ${message}</p>`,
    };
    try {
      const email = await resend.emails.send(options);
      return res
        .status(200)
        .json(new apiResponse(200, email, "Contact sent successfully"));
    } catch (error) {
      console.log(error);
      throw new apiError(500, error.message);
    }
  }
});

export { contact };
