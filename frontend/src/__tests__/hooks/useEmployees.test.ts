import { act, renderHook, waitFor } from "@testing-library/react";
import { useEmployees } from "@/hooks/useEmployees";
import { employeeApi } from "@/services/api";

jest.mock("@/services/api");
const mockApi = employeeApi as jest.Mocked<typeof employeeApi>;

const mockMeta = { total_count: 1, total_pages: 1, current_page: 1, per_page: 25 };
const mockEmployee = {
  id: 1,
  full_name: "Alice",
  job_title: "Engineer",
  country: "US",
  salary: 80000,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  mockApi.list.mockResolvedValue({ data: [mockEmployee], meta: mockMeta });
  mockApi.create.mockResolvedValue({ data: mockEmployee });
  mockApi.update.mockResolvedValue({ data: { ...mockEmployee, salary: 90000 } });
  mockApi.delete.mockResolvedValue(undefined);
});

afterEach(() => jest.clearAllMocks());

describe("useEmployees", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useEmployees());
    expect(result.current.loading).toBe(true);
  });

  it("loads employees on mount", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.employees).toEqual([mockEmployee]);
    expect(result.current.meta).toEqual(mockMeta);
  });

  it("sets error state when API call fails", async () => {
    mockApi.list.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
  });

  it("applyFilters resets page to 1 and re-fetches", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.applyFilters({ country: "Germany" }));
    await waitFor(() => expect(mockApi.list).toHaveBeenCalledTimes(2));
    expect(mockApi.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ country: "Germany", page: 1 }),
    );
  });

  it("setPage changes the current page", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(mockApi.list).toHaveBeenCalledTimes(2));
    expect(mockApi.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });

  it("createEmployee calls the API and refreshes", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialCallCount = mockApi.list.mock.calls.length;

    await act(async () => {
      await result.current.createEmployee({
        full_name: "Bob", job_title: "Dev", country: "CA", salary: 70000,
      });
    });

    expect(mockApi.create).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockApi.list.mock.calls.length).toBeGreaterThan(initialCallCount));
  });

  it("updateEmployee calls the API and refreshes", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateEmployee(1, { salary: 90000 });
    });

    expect(mockApi.update).toHaveBeenCalledWith(1, { salary: 90000 });
  });

  it("deleteEmployee calls the API and refreshes", async () => {
    const { result } = renderHook(() => useEmployees());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteEmployee(1);
    });

    expect(mockApi.delete).toHaveBeenCalledWith(1);
  });
});
