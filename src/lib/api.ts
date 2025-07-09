import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { env } from "../env";

const axiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const contentType =
    config.data instanceof FormData
      ? "multipart/form-data"
      : "application/json";
  config.headers["Content-Type"] = contentType;
//   if (retrieveToken()) {
//     config.headers.Authorization = `Bearer ${retrieveToken()}`;
//   }
  return config;
});

export const api = async <T>(
  url: string,
  config: AxiosRequestConfig
): Promise<T> =>
  axiosInstance
    .request<T>({
      url,
      ...config,
    })
    .then((response: AxiosResponse<T>) => response.data);
