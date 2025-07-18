var __defProp = Object.defineProperty;
var __name = (target, value) =>
  __defProp(target, "name", { value, configurable: true });

// index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const subdomain = url.hostname.split(".")[0];
    if (url.hostname === "cdn.letshost.dpdns.org") {
      return await handleCDNRequest(request, url);
    } else if (url.hostname === "www.letshost.dpdns.org") {
      return Response.redirect("https://letshost.dpdns.org", 302);
    } else {
      const proxyUrl = `${process.env.BACKEND_URL}${url.pathname}`;
      const modifiedRequest = new Request(proxyUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "manual",
      });

      modifiedRequest.headers.set("X-Subdomain", subdomain);
      console.log("proxy_url=", proxyUrl);
      console.log("modified request", modifiedRequest.headers);
      return fetch(modifiedRequest);
    }
  },
};
async function handleCDNRequest(request, url) {
  let targetUrl;
  const pathWithoutQuery = url.pathname;
  const fileExtension = pathWithoutQuery.split(".").pop().toLowerCase();
  console.log("Processing CDN request:", {
    pathname: url.pathname,
    search: url.search,
    fileExtension,
  });
  if (
    ["mp4", "webm", "avi", "mov", "mkv", "flv", "m4v"].includes(fileExtension)
  ) {
    if (url.search) {
      targetUrl = `${process.env.TRANSFORMER_URL}${url.pathname}${url.search}`;
    } else {
      targetUrl = `${process.env.IMAGE_STORAGE_URL}${url.pathname}`;
    }
  } else if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
      fileExtension
    )
  ) {
    if (url.search) {
      targetUrl = `${process.env.TRANSFORMER_URL}${url.pathname}${url.search}`;
    } else {
      targetUrl = `${process.env.IMAGE_STORAGE_URL}${url.pathname}`;
    }
  } else if (["css", "js"].includes(fileExtension)) {
    targetUrl = `${process.env.FILE_STORAGE_URL}${url.pathname}${url.search || ""}`;
  } else {
    targetUrl = `${process.env.FILE_STORAGE_URL}${url.pathname}${url.search || ""}`;
  }
  console.log("Target URL:", targetUrl);
  try {
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual",
    });
    proxyRequest.headers.delete("Host");
    const response = await fetch(proxyRequest);
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    return newResponse;
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
__name(handleCDNRequest, "handleCDNRequest");
export { index_default as default };
//# sourceMappingURL=index.js.map
