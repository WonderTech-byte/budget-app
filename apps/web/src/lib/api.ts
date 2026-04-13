const DEFAULT_API_ORIGIN = "https://bugdet-maker-production.up.railway.app";
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? DEFAULT_API_ORIGIN).replace(/\/$/, "");

export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include", // 🔹 send cookies
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let error = "Something went wrong";
    try {
      const data = await res.clone().json();
      error = data.error || data.message || error;
    } catch (e) {
      // If response isn't JSON, try to get text
      try {
        const text = await res.text();
        if (text) {
          error = text;
        } else {
          error = `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (textError) {
        error = `HTTP ${res.status}: ${res.statusText}`;
      }
    }
    console.error(`API Error [${res.status}]:`, error);
    throw new Error(error);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function getApiError(error: any): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message || "Something went wrong";
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.data?.error) {
    return error.data.error;
  }
  return error?.message || "Something went wrong";
}

// ---------------- AUTH ----------------

export function loginApi(email: string, password: string) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi(data: {
  username: string;
  fullName: string;
  email: string;
  password: string;
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logoutApi() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export function resetPasswordApi(email: string) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// 🔹 Validate OTP for password reset
export function validateOtpApi(otp: string) {
  return request("/auth/otp", {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

// 🔹 Submit new password with OTP
export function submitNewPasswordApi(otp: string, newPassword: string) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ otp, newPassword }),
  });
}

// 🔹 Fetch current user from session
export function getCurrentUserApi() {
  return request("/auth/me", {
    method: "GET",
  });
}

// ---------------- BUDGETS ----------------

export type BudgetStatus = string;

export type BudgetSummary = {
  id: string;
  title: string;
  status: BudgetStatus;
  formattedStartDate: string;
  formattedEndDate: string;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  formattedCreatedAt: string | null;
  formattedCompletedAt: string | null;
};

export type InflowDTO = {
  id: string;
  label: string;
  amount: string;
};

export type BudgetCategoryDTO = {
  id: string;
  name: string;
  plannedAmount: string;
};

export type TransactionDTO = {
  id: string;
  itemName: string;
  amount: string;
  type: string;
  categoryId: string;
  categoryName: string;
  formattedDate: string;
  formattedCreatedAt: string;
};

export type BudgetDetail = BudgetSummary & {
  inflows: InflowDTO[];
  categories: BudgetCategoryDTO[];
  transactions: TransactionDTO[];
  totalInflow: string;
  totalPlanned: string;
};

export function getBudgetsApi() {
  return request("/budgets", {
    method: "GET",
  });
}

export type BudgetCreatePayload = {
  title: string;
  startDate: string;
  endDate: string;
  status?: BudgetStatus;
  inflows?: {
    label: string;
    amount: string;
  }[];
  categories?: {
    name: string;
    plannedAmount: string;
  }[];
};

export function createBudgetApi(data: BudgetCreatePayload) {
  return request("/budgets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createBudgetInflowApi(budgetId: string, data: { label: string; amount: string }) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/inflows`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createBudgetTransactionApi(
  budgetId: string,
  data: {
    itemName: string;
    amount: string;
    date: string;
    type: string;
    categoryId?: string;
    categoryName?: string;
  }
) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBudgetInflowApi(budgetId: string, inflowId: string, data: { label: string; amount: string }) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/inflows/${encodeURIComponent(inflowId)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateBudgetTransactionApi(
  budgetId: string,
  transactionId: string,
  data: {
    itemName: string;
    amount: string;
    date: string;
    type: string;
    categoryId?: string;
  }
) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/transactions/${encodeURIComponent(transactionId)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createBudgetCategoryApi(budgetId: string, data: { name: string; plannedAmount: string }) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBudgetCategoryApi(
  budgetId: string,
  categoryId: string,
  data: {
    name: string;
    plannedAmount: string;
  }
) {
  return request(`/budgets/${encodeURIComponent(budgetId)}/categories/${encodeURIComponent(categoryId)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getBudgetByIdApi(id: string) {
  return request(`/budgets/${encodeURIComponent(id)}`, {
    method: "GET",
  }) as Promise<BudgetDetail>;
}
