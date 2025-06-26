import config from "@/config/config";
import ApiRoutes from "@/connectors/api-routes";
import { useQuery, useMutation, useQueryClient , useInfiniteQuery} from "@tanstack/react-query";

import axios, { type AxiosProgressEvent } from "axios";
import { AxiosError } from "axios";
import { getErrorMsg } from "@/lib/getErrorMsg";
import { useUserStore } from "@/store/store";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback, useRef } from "react";


// Helper function to get CSRF token from cookies
const getCsrfTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrf_token_client") {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to fetch CSRF token from server
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${config.BackendUrl}/csrf-token`, {
      withCredentials: true,
    });
    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    throw error;
  }
};

// Helper function to ensure CSRF token is available
const ensureCsrfToken = async (): Promise<string> => {
  let token = getCsrfTokenFromCookie();

  if (!token) {
    token = await fetchCsrfToken();
  }

  return token;
};

// useApiGet - a custom hook for GET requests
const Axios = axios.create({
  baseURL: config.BackendUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const AxiosFile = axios.create({
  baseURL: config.BackendUrl,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  withCredentials: true,
  timeout: 600000, // 10 minutes timeout
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Add request interceptor to include CSRF token
const addCsrfInterceptor = (axiosInstance: typeof Axios) => {
  axiosInstance.interceptors.request.use(
    async (config) => {
      // Skip CSRF token for GET requests to /api/v1/csrf-token
      if (config.method === "get" && config.url === "/api/v1/csrf-token") {
        return config;
      }

      try {
        const token = await ensureCsrfToken();
        if (token) {
          config.headers["X-CSRF-Token"] = token;
        }
      } catch (error) {
        console.error("Failed to add CSRF token to request:", error);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
};

// Apply CSRF interceptor to both axios instances
addCsrfInterceptor(Axios);
addCsrfInterceptor(AxiosFile);

interface UseApiGetProps {
  key: readonly [string, ...unknown[]];
  path: string;
  option?: object;
  staleTime?: number;
  enabled?: boolean;
}

export const useApiGet = ({
  key,
  path,
  option = {},
  enabled = false,
  staleTime = Infinity,
}: UseApiGetProps) => {
  const queryClient = useQueryClient();
  const userStore = useUserStore();
  const userLocal=localStorage.getItem("User")
  const user=userLocal?JSON.parse(userLocal).state.user:null;
  const navigate = useNavigate();
  const fn = async () => {
    try {
      return await Axios.get(path, option);
    } catch (error: unknown) {
      const err = error as AxiosError;

      const msg = getErrorMsg(err)?.toLowerCase();


      if (
        err?.response?.status === 401 &&
        (msg.includes("unauthorized") ||
          msg.includes("jwt expired") ||
          msg.includes("invalid access") ||
          msg.includes("jwt malformed") ||
          msg.includes("invalid signature") ||
          msg.includes("invalid token") ||
          msg.includes("invalid credentials") ||
          msg.includes("token expired") ||
          msg.includes("token revoked") ||
          msg.includes("token not found") ||
          msg.includes("token malformed") ||
          msg.includes("signature expired") ||
          msg.includes("signature not found") ||
          msg.includes("signature malformed") ||
          msg.includes("signature revoked") ||
          msg.includes("credentials expired") ||
          msg.includes("credentials not found") ||
          msg.includes("credentials malformed") ||
          msg.includes("credentials revoked") ||
          err.response.statusText.includes("Unauthorized"))
          &&user
      ) {
        // This will finally trigger
        console.log("Reauth triggered due to:", msg);
        try {
          const res = await Axios.post(ApiRoutes.generateNewTokens, option);

          if (res.status === 200) {
            await queryClient.invalidateQueries({ queryKey: key });
          } else {
            navigate("/auth?mode=login");
            userStore.deleteUser();
          }
        } catch (err) {
          navigate("/auth?mode=login");
          await axios.get(ApiRoutes.logout);
          userStore.deleteUser();
          throw err;
        }

        throw err;
      }
    }
  };
  return useQuery({
    queryKey: key,
    queryFn: fn,
    staleTime,
    enabled,
  });
};

// useApiSend - a custom hook for POST/PUT/DELETE requests
interface UseApiPostProps {
  type: "post" | "put" | "delete" | "patch";
  key: readonly [string, ...unknown[]];
  path: string;
  option?: object;
  sendingFile?: boolean;
  setUploadProgress?: (progress: number) => void;
  onCancel?: () => void; // Optional callback when request is cancelled
}

export const useApiPost = ({
  type,
  key,
  path,
  sendingFile = false,
  setUploadProgress,
  onCancel,
}: UseApiPostProps) => {
  // Store the current request's abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const reauthenticateFn = async (signal?: AbortSignal) => {
    return Axios.post(ApiRoutes.generateNewTokens, {}, { signal });
  };

  const userStore = useUserStore();
  const navigate = useNavigate();
   const userLocal=localStorage.getItem("User")
  const user=userLocal?JSON.parse(userLocal).state.user:null;
  // Cancel function to abort ongoing requests
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      onCancel?.();
    }
  }, [onCancel]);

  // Cleanup on component unmount or page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      cancelRequest();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cancelRequest(); // Cancel on unmount
    };
  }, [cancelRequest]);

  const fn = async (data: any) => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (sendingFile) {
        const formData = new FormData();
        const relativePaths: string[] = [];
        formData.append("subDomain", data?.subDomain);
        formData.append("cdnProjectID", data?.cdnProjectID);

        for (const file of data.files) {
          let relativePath = file.webkitRelativePath || file.name;
          const idx = relativePath.indexOf("/");
          if (idx !== -1) {
            relativePath = relativePath.slice(idx);
          }
          formData.append("files", file, relativePath);
          relativePaths.push(relativePath);
        }

        const headers = {
          "X-Relative-Paths": JSON.stringify(relativePaths),
        };

        const config = {
          headers,
          signal, // Add abort signal
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (
              typeof progressEvent.total === "number" &&
              progressEvent.total > 0
            ) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress?.(progress);
            }
          },
        };

        let response;
        switch (type) {
          case "put":
            response = await AxiosFile.put(path, formData, config);
            break;
          case "delete":
            response = await AxiosFile.delete(path, {
              data: formData,
              ...config,
            });
            break;
          case "post":
            response = await AxiosFile.post(path, formData, config);
            break;
          case "patch":
            response = await AxiosFile.patch(path, formData, config);
            break;
          default:
            throw new Error("Unsupported method type");
        }

        // Clear the abort controller on successful completion
        abortControllerRef.current = null;
        return response;
      } else {
        // JSON payload requests
        const config = { signal };
        let response;

        switch (type) {
          case "put":
            response = await Axios.put(path, data, config);
            break;
          case "delete":
            response = await Axios.delete(path, { data, signal });
            break;
          case "post":
            response = await Axios.post(path, data, config);
            break;
          case "patch":
            response = await Axios.patch(path, data, config);
            break;
          default:
            throw new Error("Unsupported method type");
        }

        // Clear the abort controller on successful completion
        abortControllerRef.current = null;
        return response;
      }
    } catch (error:any) {
      // Check if the error is due to cancellation
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        console.log("Request was cancelled");
        abortControllerRef.current = null;
        throw new Error("Request cancelled");
      }

      const err = error as AxiosError;
      const msg = getErrorMsg(err)?.toLowerCase();

      if (
        err?.response?.status === 401 &&
        (msg.includes("unauthorized") ||
          msg.includes("jwt expired") ||
          msg.includes("invalid access") ||
          msg.includes("jwt malformed") ||
          msg.includes("invalid signature") ||
          msg.includes("invalid token") ||
          msg.includes("invalid credentials") ||
          msg.includes("token expired") ||
          msg.includes("token revoked") ||
          msg.includes("token not found") ||
          msg.includes("token malformed") ||
          msg.includes("signature expired") ||
          msg.includes("signature not found") ||
          msg.includes("signature malformed") ||
          msg.includes("signature revoked") ||
          msg.includes("credentials expired") ||
          msg.includes("credentials not found") ||
          msg.includes("credentials malformed") ||
          msg.includes("credentials revoked") ||
          err.response.statusText.includes("Unauthorized"))
          &&user
      ) {
        console.log("Reauth triggered due to:", msg);
        try {
          // Check if request was cancelled before reauth
          if (signal.aborted) {
            throw new Error("Request cancelled");
          }

          const res = await reauthenticateFn(signal);
          if (res.status === 200) {
            // Check again if request was cancelled before retry
            if (signal.aborted) {
              throw new Error("Request cancelled");
            }

            // Retry the original request
            if (sendingFile) {
              const formData = new FormData();
              const relativePaths: string[] = [];
              formData.append("subDomain", data?.subDomain);
              formData.append("cdnProjectID", data?.cdnProjectID);

              for (const file of data.files) {
                let relativePath = file.webkitRelativePath || file.name;
                const idx = relativePath.indexOf("/");
                if (idx !== -1) {
                  relativePath = relativePath.slice(idx);
                }
                formData.append("files", file, relativePath);
                relativePaths.push(relativePath);
              }

              const headers = {
                "X-Relative-Paths": JSON.stringify(relativePaths),
              };

              const retryConfig = { headers, signal };

              switch (type) {
                case "put":
                  return await AxiosFile.put(path, formData, retryConfig);
                case "delete":
                  return await AxiosFile.delete(path, {
                    data: formData,
                    ...retryConfig,
                  });
                case "post":
                  return await AxiosFile.post(path, formData, retryConfig);
                case "patch":
                  return await AxiosFile.patch(path, formData, retryConfig);
              }
            } else {
              const retryConfig = { signal };
              switch (type) {
                case "put":
                  return await Axios.put(path, data, retryConfig);
                case "delete":
                  return await Axios.delete(path, { data, signal });
                case "post":
                  return await Axios.post(path, data, retryConfig);
                case "patch":
                  return await Axios.patch(path, data, retryConfig);
              }
            }
          } else {
            navigate("/auth?mode=login");
            await axios.get(ApiRoutes.logout);
            userStore.deleteUser();
          }
        } catch (retryErr:any) {
          if (
            retryErr.name === "AbortError" ||
            retryErr.code === "ERR_CANCELED" ||
            retryErr.message === "Request cancelled"
          ) {
            console.log("Retry request was cancelled");
            throw new Error("Request cancelled");
          }
         
          throw retryErr;
        }
      }

      abortControllerRef.current = null;
      throw err;
    }
  };

  const mutation = useMutation({
    mutationKey: key,
    mutationFn: fn,
  });

  // Attach cancel method to the mutation object for optional use
  (mutation as any).cancel = cancelRequest;
  (mutation as any).isAborted = () =>
    abortControllerRef.current?.signal.aborted ?? false;

  return mutation;
};
interface UseApiInfiniteQueryProps {
  key: readonly [string, ...unknown[]];
  path: string;
  option?: object;
  enabled?: boolean;
  staleTime?: number;
  limit?: number;
  tags?: string;
  query?: string;
  getNextPageParam: (lastPage: any, allPages: any[]) => number | undefined;
  initialPageParam?: number;
  getPreviousPageParam?: (firstPage: any, allPages: any[]) => number | undefined;
}

export const useApiInfiniteQuery = ({
  key,
  path,
  option = {},
  enabled = true,
  staleTime = Infinity,
  getNextPageParam,
  initialPageParam = 1,
  limit = 10,
  tags="",
  query="",
  getPreviousPageParam,
}: UseApiInfiniteQueryProps) => {


  const fn = async ({ pageParam }:any) => {
    try {
      console.log('Fetching page:', pageParam, 'with limit:', limit);
      
      // Build the URL with page parameter
      const url = path.includes('?') 
        ? `${path}&query=${query}&page=${pageParam}&limit=${limit}&tags=${tags}` 
        : `${path}?query=${query}&page=${pageParam}&limit=${limit}&tags=${tags}`;
      
      const response = await Axios.get(url, option);
      console.log('API Response:', response.data);
      
      return response;
    } catch (error: unknown) {
      const err = error as AxiosError;
      

      throw err;
    }
  };

  return useInfiniteQuery({
    queryKey: key,
    queryFn: fn,
    getNextPageParam,
    getPreviousPageParam,
    initialPageParam,
    staleTime,
    enabled,
  });
};