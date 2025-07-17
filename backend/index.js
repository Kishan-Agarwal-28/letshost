import { connectDB } from "./db/connectDB.js";
import { connectRedis, redis } from "./db/connectRedis.js";
import { connectvectorDB } from "./db/connectVectorDB.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  csrfMiddleware,
  csrfTokenHandler,
} from "./middlewares/csrfToken.middleware.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { xssSanitizer } from "./middlewares/xss.middleware.js";
import mongoSanitize from 'express-mongo-sanitize';

const app = express();
app.use(
  cors({
    origin: [
      "https://letshost.dpdns.org",
      "http://letshost.dpdns.org",
      /^https:\/\/.*\.cloudinary\.com$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-Relative-Paths",
    ],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(helmet());
app.use(xssSanitizer())
app.use(mongoSanitize());
app.use(rateLimit({
  windowMs:60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: function (req, res, next) {
    res.status(429).json({
      message: "Too many requests from this IP, please try again later",
    });
  },
  skipFailedRequests: true, // Do not respond with 429 if the limit is reached
  keyGenerator: function (req) {
    return req.ip;
  },
  skip: function (req, res) {
    // Skip rate limiting for specific paths
    const skipPaths = [
      "/api/v1/users/auth/oauth/google/callback",
      "/api/v1/users/auth/oauth/github/callback",
      "/api/v1/users/auth/oauth/spotify/callback",
      "/api/v1/users/auth/oauth/facebook/callback",
      "/api/v1/users/auth/oauth/microsoft/callback",
      "/api/v1/users/oauth",
    ];
    return skipPaths.includes(req._parsedUrl.pathname);
  },
  onLimitReached: function (req, res, options) {
    console.warn(`Rate limit reached for IP: ${req.ip}`);
  }
  
}));
app.use(csrfMiddleware)
connectDB();
connectRedis();
connectvectorDB();
//routes import
import userRouter from "./routes/user.routes.js";
import subdomainRouter from "./routes/subdomain.routes.js";
import cdnRouter from "./routes/cdn.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import galleryRouter from "./routes/gallery.routes.js";
import creatorRouter from "./routes/creator.routes.js";
import { contact } from "./controllers/contact.controller.js";

app.use("/api/v1/csrf-token", csrfTokenHandler);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subdomains", subdomainRouter);
app.use("/api/v1/cdn", cdnRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/gallery", galleryRouter);
app.use("/api/v1/creator", creatorRouter);
app.use("/api/v1/contact", contact);
app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 3000}`
  );
});
