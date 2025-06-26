import { Resend } from "resend";
import { APPNAME } from "../constants.js";
import { generateEmailTemplates } from "./generateEmailTemplates.js";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, reason, data, html, userID) => {
  const htmlTemplate = generateEmailTemplates(
    data.username,
    data.token,
    data?.email,
    reason,
    userID
  );
  const options = {
    from: "onboarding@letshost.dpdns.org",
    to: to,
    subject:
      reason == "verify"
        ? `Verify your ${APPNAME} account `
        : reason == "forgotPassword"
          ? `Reset your password for ${APPNAME}`
          : reason == "emailChange"
            ? `Your sign-in email was changed for ${APPNAME}`
            : reason,
    html: htmlTemplate == null ? html : htmlTemplate,
  };
  try {
    const email = await resend.emails.send(options);
  } catch (error) {
    console.log(error);
  }
};
