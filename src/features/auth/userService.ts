import { Config } from "@/constants";
import { NetworkError, getResponseErrorMessage } from "@/errors";
import { getActualPlatform, isDesktop } from "@/utils/device";
import { Platform } from "react-native";
import { createAuthHeaders } from "./headers";
import type { AuthTokens, AuthUser } from "./types";

export class TokenExpiredError extends Error {
  name = "TokenExpiredError";
}

export async function getUserByAccessToken(
  accessToken: string | null,
  options?: {
    signal?: AbortSignal;
  },
) {
  if (Platform.OS !== "web" && !accessToken) {
    return null;
  }
  const res = await fetch(
    `${Config.USER_SERVICE_URL}/user/query?select=id,name,paidUser,photoUrl,notebookId,email,privacy`,
    {
      credentials: "include",
      headers: {
        ...createAuthHeaders({
          accessToken,
        }),
      },
      signal: options?.signal,
    },
  ).catch(() => {
    throw new NetworkError();
  });
  const json = await res.json().catch(async () => ({
    message: `Request failed with status ${res.status}: ${await res.text().catch(() => "")}`,
  }));
  if (json.status !== false) {
    if (!json.data) {
      throw new Error("No user data returned");
    }
    return json.data.selected as AuthUser;
  }
  if (
    json.metadata?.status === "expired" ||
    json.errorMessage?.includes("expired") ||
    json.message?.includes("expired")
  ) {
    throw new TokenExpiredError();
  }
  throw buildUserServiceError(res, json);
}

function buildUserServiceError(
  res: Response,
  json: Record<string, unknown> & {
    errorMessage?: string;
    message?: string;
    code?: string;
  },
) {
  const message =
    json.errorMessage ||
    json.message ||
    "Something went wrong while querying your user data";
  return Object.assign(new Error(message), {
    extensions: {
      code: json.code,
      response: { status: res.status },
    },
  });
}

export async function refreshAccessToken(
  expiredAccessToken: string | null,
  refreshToken: string | null,
): Promise<AuthTokens | null> {
  const userServicePlatform = isDesktop ? "desktop-ff" : "mobile";

  const res = await fetch(
    `${Config.USER_SERVICE_URL}/auth/${userServicePlatform}/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        expiredAccessToken,
        refreshToken,
      }),
      credentials: "include",
    },
  ).catch(() => {
    throw new NetworkError();
  });
  if (!res.ok) {
    const errorMessage = await getResponseErrorMessage(res);
    if (errorMessage.includes("expired")) {
      throw new TokenExpiredError();
    } else {
      throw new Error(errorMessage);
    }
  }
  if (getActualPlatform() === "web")
    return {
      accessToken: null,
      refreshToken: null,
      // default 1 hour
      expiresAt: new Date().getTime() + 60 * 60,
      // default 1 week
      refreshExpiresAt: new Date().getTime() + 60 * 60 * 24 * 7,
    };
  const json = await res.json().catch(async () => ({
    message: `Request failed with status ${res.status}: ${await res.text().catch(() => "")}`,
  }));
  return {
    accessToken: json.data.accessToken,
    refreshToken: json.data.refreshToken,
    // expiresIn is in unix timestamp
    // see https://github.com/firefliesai/user-service/blob/64c3c3f24de13b1cdf7fee4f9e954692394ea955/src/modules/users/controllers/auth.controller.utils.ts#L16
    expiresAt: json.data.expiresIn,
    refreshExpiresAt: json.data.refreshExpiresIn,
  };
}
