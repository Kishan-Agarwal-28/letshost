import { connectDB } from "./db/connectDB.js";
import { connectRedis, redis } from "./db/connectRedis.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
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
connectDB();
connectRedis();

//routes import
import userRouter from "./routes/user.routes.js";
import subdomainRouter from "./routes/subdomain.routes.js";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subdomains", subdomainRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 3000}`
  );
});
