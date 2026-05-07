import type { Page } from "@playwright/test";

export const MOCK_TOKEN = "mock-jwt-token-for-testing";
export const MOCK_USER = { id: 1, email: "hr@incubyte.co", role: "hr_manager" };
export const HR_EMAIL = "hr@incubyte.co";
export const HR_PASSWORD = "password123";

function makeEmployee(i: number) {
  return {
    id: i,
    employee_id: `EMP-2024-${String(i).padStart(6, "0")}`,
    first_name: `First${i}`,
    last_name: `Last${i}`,
    preferred_name: null,
    full_name: `First${i} Last${i}`,
    display_name: `First${i} Last${i}`,
    initials: "FL",
    work_email: `first${i}@techcorp.io`,
    phone_number: null,
    job_title: i % 2 === 0 ? "Software Engineer" : "Designer",
    job_level: "IC2",
    department: "Engineering",
    business_unit: null,
    employment_status: "Active",
    employment_type: "Full-Time",
    manager_name: null,
    work_location: null,
    country: i % 3 === 0 ? "United Kingdom" : "United States",
    salary: 80000 + i * 500,
    currency: "USD",
    salary_band: "Band-2",
    bonus_percentage: 10,
    stock_grant_value: null,
    hire_date: "2023-01-15",
    compensation_review_date: "2024-01-15",
    notes: null,
    created_at: "2023-01-15T00:00:00Z",
    updated_at: "2023-01-15T00:00:00Z",
  };
}

const MOCK_EMPLOYEES = Array.from({ length: 30 }, (_, i) => makeEmployee(i + 1));

export async function setupAuthMock(page: Page) {
  await page.route("**/api/v1/auth/login", async (route) => {
    const body = route.request().postDataJSON() as {
      user?: { email?: string; password?: string };
    } | null;
    const email = body?.user?.email;
    const password = body?.user?.password;

    if (email === HR_EMAIL && password === HR_PASSWORD) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: MOCK_TOKEN, user: MOCK_USER }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid email or password" }),
      });
    }
  });
}

export async function setupEmployeesMock(page: Page) {
  await page.route("**/api/v1/employees**", async (route) => {
    const method = route.request().method();

    if (method === "POST") {
      const body = route.request().postDataJSON() as {
        employee?: Record<string, unknown>;
      } | null;
      const emp = body?.employee ?? {};
      const created = {
        ...makeEmployee(999),
        first_name: String(emp["first_name"] ?? "New"),
        last_name: String(emp["last_name"] ?? "Employee"),
        full_name: `${emp["first_name"] ?? "New"} ${emp["last_name"] ?? "Employee"}`,
        display_name: `${emp["first_name"] ?? "New"} ${emp["last_name"] ?? "Employee"}`,
        job_title: String(emp["job_title"] ?? "Specialist"),
        country: String(emp["country"] ?? "United States"),
        salary: Number(emp["salary"] ?? 75000),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: created }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const country = url.searchParams.get("country");
    const name = url.searchParams.get("name");
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "asc";
    const page_ = parseInt(url.searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(url.searchParams.get("per_page") ?? "25", 10);

    let filtered = [...MOCK_EMPLOYEES];
    if (country) filtered = filtered.filter((e) => e.country === country);
    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter((e) => e.full_name.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] as number | string;
      const bVal = b[sortBy as keyof typeof b] as number | string;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const start = (page_ - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: paginated,
        meta: {
          total_count: total,
          total_pages: Math.ceil(total / perPage),
          current_page: page_,
          per_page: perPage,
        },
      }),
    });
  });
}
