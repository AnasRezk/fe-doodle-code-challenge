export type AuthenticatedRequestInit = RequestInit & {
  accessToken: string;
};

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

function getApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new ApiConfigurationError("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return new URL(path, baseUrl);
}

async function redirectUnauthorizedUser() {
  if (typeof globalThis.location === "undefined") {
    return;
  }

  try {
    await fetch("/api/auth/logout", {
      cache: "no-store",
      method: "POST",
    });
  } finally {
    globalThis.location.replace("/login");
  }
}

export async function apiFetch(
  path: string,
  { accessToken, headers: requestHeaders, ...init }: AuthenticatedRequestInit,
) {
  if (!accessToken.trim()) {
    throw new ApiConfigurationError("An access token is required for API requests.");
  }

  const headers = new Headers(requestHeaders);
  headers.set("authorization", `Bearer ${accessToken}`);

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 401) {
    await redirectUnauthorizedUser();
  }

  return response;
}
