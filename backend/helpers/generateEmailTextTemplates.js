import { APPNAME, APPURL } from "../constants.js";

export const generatePlainTextEmailTemplates = (
  username,
  token,
  email = "",
  reason = "",
  userID = ""
) => {
  let text;
  let link = ""; // Define the link dynamically

  switch (reason) {
    case "verify":
      link = `${APPURL}/auth/verify/?token=${token}`;
      text = `Verify Your ${APPNAME} Account

Hello ${username},

Thank you for signing up! Please verify your email by clicking the link below or copying it into your browser:

${link}

If you didn't create an account, please ignore this email.

- The ${APPNAME} Team`;
      break;

    case "forgotPassword":
      link = `${APPURL}/auth/reset-password/?token=${token}`;
      text = `Reset Your Password

Hello ${username},

We received a request to reset your password. Click the link below to reset it:

${link}

If you didn't request this, you can safely ignore this email.

- The ${APPNAME} Team`;
      break;

    case "emailChange":
      text = `Your Sign-In Email Was Changed

Hello ${username},

Your email address was successfully changed to ${email}.

If this wasn't you, please contact our support team immediately.

- The ${APPNAME} Team`;
      break;

    case "emailChangeVerification":
      link = `${APPURL}/auth/verify-email-change/?token=${token}`;
      text = `Email Change Request

Hi ${username},

We received a request to change your sign-in email on ${APPNAME}.

If this was you, please confirm your new email by visiting the link below:

${link}

If you did not request this, please ignore this email. Your email will remain unchanged.

- The ${APPNAME} Team`;
      break;

    case "updatePassword":
      link = `${APPURL}/dashboard?uid=${userID}&token=${token}`;
      text = `Reset Your Password

Hello ${username},

We received a request to update your password. Click the link below to reset it:

${link}

If you didn't request this, you can safely ignore this email.

- The ${APPNAME} Team`;
      break;

    default:
      text = null;
  }

  return text;
};