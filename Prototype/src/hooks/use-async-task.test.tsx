import { act, renderHook } from "@testing-library/react";
import { useAsyncTask } from "./use-async-task";

it("stays busy until completion and suppresses a duplicate request", async () => {
  let finish!: () => void;
  const task = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const { result } = renderHook(() => useAsyncTask());
  let request!: Promise<void>;
  act(() => { request = result.current[1](task); });
  expect(result.current[0]).toBe(true);
  await act(async () => { await result.current[1](task); });
  expect(task).toHaveBeenCalledTimes(1);
  await act(async () => { finish(); await request; });
  expect(result.current[0]).toBe(false);
});

it("releases controls after a failed request so the user can retry", async () => {
  const { result } = renderHook(() => useAsyncTask());
  await act(async () => { await expect(result.current[1](async () => { throw new Error("Unavailable"); })).rejects.toThrow("Unavailable"); });
  expect(result.current[0]).toBe(false);
  const retry = jest.fn(async () => {});
  await act(async () => { await result.current[1](retry); });
  expect(retry).toHaveBeenCalledTimes(1);
});
