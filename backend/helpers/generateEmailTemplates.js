import { APPNAME, APPURL } from "../constants.js";

export const generateEmailTemplates = (
  username,
  token,
  email = "",
  reason = "",
  userID = ""
) => {
  let html;
  let link = ""; // Define the link dynamically

  switch (reason) {
    case "verify":
      link = `${APPURL}/auth/verify/?token=${token}`;
      html = `
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600px" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center">
                            <h2 style="color: #333;">Verify Your ${APPNAME} Account</h2>
                            <p style="color: #555;">Hello ${username},</p>
                            <p>Thank you for signing up! Please verify your email by clicking the button below.</p>
                            <a href="${link}" style="display: inline-block; background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                            <p>If the button does not work, copy and paste this link into your browser:</p>
                            <p><a href="${link}" style="color: #007bff;">${link}</a></p>
                            <p>If you didn't create an account, please ignore this email.</p>
                            <p style="color: #777;">- The ${APPNAME} Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>`;
      break;

    case "forgotPassword":
      link = `${APPURL}/auth/reset-password/?token=${token}`;
      html = `
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600px" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center">
                            <h2 style="color: #333;">Reset Your Password</h2>
                            <p style="color: #555;">Hello ${username},</p>
                            <p>We received a request to reset your password. Click the button below to reset it:</p>
                            <a href="${link}" style="display: inline-block; background: #ff5733; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                            <p>If the button does not work, copy and paste this link into your browser:</p>
                            <p><a href="${link}" style="color: #007bff;">${link}</a></p>
                            <p>If you didn’t request this, you can safely ignore this email.</p>
                            <p style="color: #777;">- The ${APPNAME} Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>`;
      break;

    case "emailChange":
      html = `
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600px" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center">
                            <h2 style="color: #333;">Your Sign-In Email Was Changed</h2>
                            <p style="color: #555;">Hello ${username},</p>
                            <p>Your email address was successfully changed to <strong>${email}</strong>.</p>
                            <p>If this wasn’t you, please contact our support team immediately.</p>
                            <p style="color: #777;">- The ${APPNAME} Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>`;
      break;

    case "emailChangeVerification":
      link = `${APPURL}/auth/verify-email-change/?token=${token}`;
      html = `
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="width: 100%; max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; padding: 10px 0;">
            <h1 style="color: #333; margin: 0;">${APPNAME}</h1>
        </div>
        <div style="padding: 20px; text-align: center; color: #555;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Change Request</h2>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                Hi <strong>${username}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                We received a request to change your sign-in email on <strong>${APPNAME}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                If this was you, please confirm your new email by clicking the button below:
            </p>
            <a href="${link}" 
               style="display: inline-block; padding: 12px 20px; color: #ffffff; background-color: #007BFF; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px;">
               Verify Email Change
            </a>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${link}" style="color: #007bff;">${link}</a></p>
            <p style="font-size: 16px; line-height: 1.5; margin-top: 20px;">
                If you did not request this, please ignore this email. Your email will remain unchanged.
            </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #888;">
            <p style="color: #777;">- The ${APPNAME} Team</p>
        </div>
    </div>
</body>`;
      break;
    case "updatePassword":
      link = `${APPURL}/dashboard?uid=${userID}&token=${token}`;
      html = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="600px" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td align="center">
                            <h2 style="color: #333;">Reset Your Password</h2>
                            <p style="color: #555;">Hello ${username},</p>
                            <p>We received a request to reset update your password. Click the button below to reset it:</p>
                            <a href="${link}" style="display: inline-block; background: #ff5733; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                            <p>If the button does not work, copy and paste this link into your browser:</p>
                            <p><a href="${link}" style="color: #007bff;">${link}</a></p>
                            <p>If you didn’t request this, you can safely ignore this email.</p>
                            <p style="color: #777;">- The ${APPNAME} Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
`;
    default:
      html = null;
  }
  return html;
};
