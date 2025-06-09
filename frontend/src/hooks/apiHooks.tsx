import config from "@/config/config";
import ApiRoutes from "@/connectors/api-routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AxiosError } from "axios";
import { getErrorMsg } from "@/lib/getErrorMsg";
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
  timeout: 600000, // 5 minutes timeout
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

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

  const fn = async () => {
    try {
      return await Axios.get(path, option);
    } catch (error: unknown) {
      const err = error as AxiosError;

      if (
        (err?.response?.status === 401 &&
          getErrorMsg(err) === "Unauthorized request") ||
        getErrorMsg(err) === "Invalid Access Token"
      ) {
        const res = await Axios.post(ApiRoutes.generateNewTokens, option);
        if (res.status === 200) {
          await queryClient.invalidateQueries({ queryKey: key });
        }
      }

      throw err;
    }
  };

  return useQuery({
    queryKey: key,
    queryFn: fn,
    staleTime,
    enabled,
  });
};

// // useApiSend - a custom hook for POST/PUT/DELETE requests
interface UseApiPostProps {
  type: "post" | "put" | "delete" | "patch";
  key: readonly [string, ...unknown[]];
  path: string;
  option?: object;
  sendingFile?: boolean;
}
export const useApiPost = ({
  type,
  key,
  path,
  sendingFile = false,
}: UseApiPostProps) => {
  // Token refresh logic
  const reauthenticateFn = async () => {
    return Axios.post(ApiRoutes.generateNewTokens);
  };

  const fn = async (data: any) => {
    try {
      if (sendingFile) {
        const formData = new FormData();
        const relativePaths = [];
        formData.append("subDomain", data?.subDomain);

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

        switch (type) {
          case "put":
            return await AxiosFile.put(path, formData, { headers });
          case "delete":
            return await AxiosFile.delete(path, { data: formData, headers });
          case "post":
            return await AxiosFile.post(path, formData, { headers });
          case "patch":
            return await AxiosFile.patch(path, formData, { headers });
          default:
            throw new Error("Unsupported method type");
        }
      }
      switch (type) {
        case "put":
          return await Axios.put(path, data);
        case "delete":
          return await Axios.delete(path, { data });
        case "post":
          return await Axios.post(path, data);
        case "patch":
          return await Axios.patch(path, data);
        default:
          throw new Error("Unsupported method type");
      }
    } catch (error) {
      const err = error as AxiosError;
      console.log(err);
      // Handle 401 Unauthorized
      if (
        (err?.response?.status === 401 &&
          getErrorMsg(err) === "Unauthorized request") ||
        getErrorMsg(err) === "Invalid Access Token"
      ) {
        const res = await reauthenticateFn();

        if (res.status === 200) {
          // Retry the original mutation
          switch (type) {
            case "put":
              return await Axios.put(path, data);
            case "delete":
              return await Axios.delete(path, { data });
            case "post":
              return await Axios.post(path, data);
            case "patch":
              return await Axios.patch(path, data);
          }
        }
      }
      throw error; // Original error if not 401 or retry fails
    }
  };

  return useMutation({ mutationKey: key, mutationFn: fn });
};
