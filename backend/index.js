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
// app.use(csrfMiddleware)
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
