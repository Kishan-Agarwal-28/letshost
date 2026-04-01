import type { AxiosError } from "axios";
import type { UseMutationResult, UseQueryResult, UseInfiniteQueryResult } from "@tanstack/react-query";

// Overloads
export function getErrorMsg(
  handler: UseMutationResult<any, Error, any, any>
): string;
export function getErrorMsg(handler: UseQueryResult<any, Error>): string;
export function getErrorMsg(handler: UseInfiniteQueryResult<any, Error>): string;
export function getErrorMsg(handler: Error | AxiosError): string;
export function getErrorMsg(handler: AxiosError): string;

// Implementation
export function getErrorMsg(handler: { error?: unknown } | Error | AxiosError): string {
  const error =
    (handler && typeof handler === "object" && "isAxiosError" in handler)
      ? handler // it's an AxiosError directly
      : ("error" in handler ? handler.error : handler);

  if (error && typeof error === "object" && "response" in error) {
    const raw = (error as AxiosError).response?.data;

    // Check if string format (HTML error)
    if (typeof raw === "string") {
      const match = raw.match(/<pre>Error: (.*?)<br>/);
      if (match && match[1]) {
        return match[1];
      }

      return raw; // fallback to raw string message
    }

    // Check if object format
    if (typeof raw === "object" && raw) {
      if ("message" in raw && typeof raw.message === "string") {
        return raw.message;
      }
      if ("error" in raw && typeof raw.error === "string") {
        return raw.error;
      }
    }
  }

  return "Something went wrong";
}
