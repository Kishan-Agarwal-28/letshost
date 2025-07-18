// csrfMiddleware.js
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";

const TOKEN_SECRET = process.env.CSRFTOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error("CSRFTOKEN_SECRET is not defined in environment variables");
}

const createCsrfToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(token).digest("hex");
};

// Middleware to validate CSRF token for state-changing requests
export const csrfMiddleware = asyncHandler((req, res, next) => {
  const method = req.method;
  console.log(req.headers);
  // Skip CSRF for these specific endpoints
  const skipCSRFPaths = [
    "/api/v1/csrf-token",
    "/api/v1/cdn/video/upload/callback",
    "/api/v1/users/auth/oauth/google/callback",
    "/api/v1/users/auth/oauth/github/callback",
    "/api/v1/users/auth/oauth/spotify/callback",
    "/api/v1/users/auth/oauth/facebook/callback",
    "/api/v1/users/auth/oauth/microsoft/callback",
    "/api/v1/users/oauth",
  ];
  if (skipCSRFPaths.includes(req._parsedUrl.pathname)) {
    return next();
  }

  if (["POST", "PUT", "PATCH", "DELETE", "GET"].includes(method)) {
    const csrfTokenClient = req.headers["x-csrf-token"];
    const csrfTokenServer = req.cookies["csrf_token"];
    console.log("csrfTokenClient", csrfTokenClient);
    console.log("csrfTokenServer", csrfTokenServer);

    if (!csrfTokenClient || !csrfTokenServer) {
      throw new apiError(403, "CSRF token is missing");
    }

    const csrfTokenClientHash = hashToken(csrfTokenClient);

    if (csrfTokenClientHash !== csrfTokenServer) {
      throw new apiError(403, "Invalid CSRF token");
    }
  }

  next();
});

// Endpoint to send CSRF token to frontend
export const csrfTokenHandler = asyncHandler((req, res) => {
  let csrfToken = req.cookies["csrf_token_client"];
  let csrfTokenHash = req.cookies["csrf_token"];

  if (!csrfToken || !csrfTokenHash) {
    csrfToken = createCsrfToken();
    csrfTokenHash = hashToken(csrfToken);

    // Store hashed token in httpOnly cookie
    res.cookie("csrf_token", csrfTokenHash, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    // Store raw token in accessible cookie or return in JSON
    res.cookie("csrf_token_client", csrfToken, {
      secure: true,
      sameSite: "lax",
      httpOnly: false,
      domain: ".letshost.dpdns.org",
    });
  }

  // Optionally return token in JSON instead of setting client cookie
  res.json({ csrfToken });
});
