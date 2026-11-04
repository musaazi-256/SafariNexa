export const PAGE_SIZE = 9;

export function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function totalPagesFor(totalItems: number, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

/** Choices for the "N / page" select. PAGE_SIZE (the default) is always included. */
export const PAGE_SIZE_OPTIONS = [...new Set([PAGE_SIZE, 20, 50, 100])].sort((a, b) => a - b);

export function parsePageSize(value: string | undefined) {
  const size = Number(value);
  return PAGE_SIZE_OPTIONS.includes(size) ? size : PAGE_SIZE;
}
