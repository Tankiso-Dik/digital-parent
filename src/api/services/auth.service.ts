import { ApiErrorCode, ApiException, httpClient } from "@/api/client";
import { pb, pbCollections } from "@/lib/pb";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UsernameCheckResponse,
} from "@/lib/types";
import { familyService } from "./family.service";

function usernameToAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@digital-parent.local`;
}

function mapAuthError(error: unknown): ApiException {
  if (ApiException.isApiException(error)) {
    return error;
  }

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 500;

  if (status === 400 || status === 401) {
    return new ApiException(
      {
        code: ApiErrorCode.UNAUTHORIZED,
        message: "Invalid username or password",
        status: 401,
      },
      error,
    );
  }

  if (status === 409) {
    return new ApiException(
      {
        code: ApiErrorCode.CONFLICT,
        message: "Username is already taken",
        status,
      },
      error,
    );
  }

  return new ApiException(
    {
      code: ApiErrorCode.SERVER_ERROR,
      message: "Authentication failed",
      status,
    },
    error,
  );
}

export const authService = {
  /**
   * Login with username and password.
   * Returns JWT token and associated family data.
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<LoginResponse>("/auth/login", request);
    }

    try {
      await pb
        .collection(pbCollections.users)
        .authWithPassword(
          usernameToAuthEmail(request.username),
          request.password,
        );
      const family = await familyService.getFamily();

      return {
        data: {
          token: pb.authStore.token,
          family: family.data ?? {
            id: "",
            name: "",
            members: [],
            createdAt: "",
          },
        },
      };
    } catch (error) {
      throw mapAuthError(error);
    }
  },

  /**
   * Register a new family with credentials.
   * Creates both user credentials and family data.
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<RegisterResponse>("/auth/register", request);
    }

    try {
      const email = usernameToAuthEmail(request.username);

      await pb.collection(pbCollections.users).create({
        email,
        username: request.username.trim().toLowerCase(),
        password: request.password,
        passwordConfirm: request.password,
      });

      await pb
        .collection(pbCollections.users)
        .authWithPassword(email, request.password);
      const family = await familyService.createFamily({
        name: request.familyName,
        members: request.members,
      });

      return {
        data: {
          token: pb.authStore.token,
          family: family.data,
        },
      };
    } catch (error) {
      throw mapAuthError(error);
    }
  },

  /**
   * Check if a username is available.
   */
  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<UsernameCheckResponse>("/auth/check-username", {
        params: { username },
      });
    }

    const email = usernameToAuthEmail(username);
    const users = await pb.collection(pbCollections.users).getList(1, 1, {
      filter: pb.filter("email = {:email}", { email }),
    });

    return { data: { available: users.totalItems === 0 } };
  },
};
