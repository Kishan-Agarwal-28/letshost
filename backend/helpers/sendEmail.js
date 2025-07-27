import { Resend } from "resend";
import { APPNAME } from "../constants.js";
import { generateEmailTemplates } from "./generateEmailTemplates.js";
import { generatePlainTextEmailTemplates } from "./generateEmailTextTemplates.js";
import { checkEmail } from "../services/checkMail.service.js";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({to, reason, data, html, userID,toBeVerified=true}) => {
  if(toBeVerified){
    if(!await checkEmail(data?.email)){
    throw new Error("Email is not deliverable or is disposable");
  }
  }
  const htmlTemplate = generateEmailTemplates(
    data.username,
    data.token,
    data?.email,
    reason,
    userID
  );
  const textTemplate = generatePlainTextEmailTemplates(
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
    text:textTemplate== null ? textTemplate : textTemplate
  };
  try {
    const email = await resend.emails.send(options);
  } catch (error) {
    throw new Error("Failed to send email");
  }
};
