import { connectDB } from "./db/connectDB.js";
import { connectRedis, redis } from "./db/connectRedis.js";
import { connectvectorDB } from "./db/connectVectorDB.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ipKeyGenerator } from "express-rate-limit";
import {
  csrfMiddleware,
  csrfTokenHandler,
} from "./middlewares/csrfToken.middleware.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
 import { combinedSanitizer } from './middlewares/xss.middleware.js';

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
// app.use(helmet());
// app.use(combinedSanitizer);
app.use( rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    const skipPaths = [
      "/api/v1/users/auth/oauth/google/callback",
      "/api/v1/users/auth/oauth/github/callback",
      "/api/v1/users/auth/oauth/spotify/callback",
      "/api/v1/users/auth/oauth/facebook/callback",
      "/api/v1/users/auth/oauth/microsoft/callback",
      "/api/v1/users/auth/oauth",
    ];
    
    return skipPaths.includes(req.path);
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
app.listen(process.env.PORT || 3000,'0.0.0.0', () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 3000}`
  );
});
