import express from "express";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import mime from "mime-types";
import { URL } from "url";
import { dbConnect } from "./db/dbConnect.js";
import { connectRedis } from "./db/connectRedis.js";
dbConnect();
connectRedis();
import { getSubDomain } from "./util/queryDb.js";
import jwt from "jsonwebtoken";
const app = express();

function makeRequest(url, res) {
  const parsedUrl = new URL(url);
  const requestOptions = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: "GET",
    headers: {
      "User-Agent": "Node.js Proxy",
    },
  };

  const request = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;

  const proxyReq = request(requestOptions, (proxyRes) => {
    const contentType = mime.lookup(url) || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    res.removeHeader("content-security-policy");

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    proxyRes.pipe(res);
  });
  proxyReq.on("error", (err) => {
    console.error("Request error:", err);
    res.status(500).send("Internal Server Error");
  });

  proxyReq.end();
}

app.use("/", async (req, res) => {
  try {
    console.log("Request received");
    const rawHost = req.headers.host || "";
    const subdomain = req.headers["x-subdomain"] || rawHost.split(".")[0];
    if (subdomain === "https://reverse-proxy-server-o4li") {
      return res.status(200).send("Reverse Proxy Server is running");
    } else {
      if (!subdomain) {
        return res.status(400).send("Subdomain not provided");
      }
      const subAvailable = await getSubDomain(subdomain);

      if (!subAvailable) {
        console.log("Subdomain not found");
        const params = new URLSearchParams({
          status: "404",
          reason: "Subdomain not found",
        });
        const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html?${params.toString()}`;
        makeRequest(errorUrl, res);
        return;
      } else if (subAvailable.Ispublic) {
        const filePath = req.path === "/" ? "/index.html" : req.path;
        console.log("Public file path:", filePath);
        const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subAvailable.owner}/${subAvailable.projectID}${filePath}`;
        console.log("File URL:", fileUrl);
        makeRequest(fileUrl, res);
      } else {
        const { token } = req.query;
        if (!token) {
          const params = new URLSearchParams({
            status: "401",
            reason:
              "Unauthorized Access You need a valid url token to access this site as it is private",
          });
          const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html?${params.toString()}`;
          makeRequest(errorUrl, res);
        } else {
          const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
          );
          if (!decodedToken) {
            const params = new URLSearchParams({
              status: "401",
              reason:
                "Unauthorized Access You need a valid url token to access this site as it is private",
            });
            const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html?${params.toString()}`;
            makeRequest(errorUrl, res);
          } else {
            if (decodedToken.sub !== subdomain) {
              const params = new URLSearchParams({
                status: "401",
                reason:
                  "Unauthorized Access You need a valid url token to access this site as it is private",
              });
              const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html?${params.toString()}`;
              makeRequest(errorUrl, res);
            } else {
              const filePath = req.path === "/" ? "/index.html" : req.path;

              const fileUrl = `${process.env.BASE_URI}/subdomains/__outputs/${subAvailable.owner}/${subAvailable.projectID}/${filePath}`;
              console.log("File URL:", fileUrl);
              makeRequest(fileUrl, res);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in proxy handler:", err);
    const params = new URLSearchParams({
      status: "500",
      reason: "Internal Server Error",
    });
    const errorUrl = `${process.env.BASE_URI}/subdomains/__error/index.html?${params.toString()}`;
    makeRequest(errorUrl, res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Reverse proxy server running on http://localhost:${PORT}`);
});
