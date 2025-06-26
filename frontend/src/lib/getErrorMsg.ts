import type { AxiosError } from "axios";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

// Overloads
export function getErrorMsg(
  handler: UseMutationResult<unknown, Error, unknown, unknown>,
): string;
export function getErrorMsg(handler: UseQueryResult<unknown, Error>): string;
export function getErrorMsg(handler: AxiosError): string;

// Implementation
export function getErrorMsg(handler: { error?: unknown } | AxiosError): string {
  const error =
    "isAxiosError" in handler
      ? handler // it's an AxiosError directly
      : handler.error;

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
