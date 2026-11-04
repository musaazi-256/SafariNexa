import { render, screen } from "@testing-library/react";
import { Pagination, pageWindow } from "./page-pagination";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

it("windows long page ranges with ellipses", () => {
  expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, null, 10]);
  expect(pageWindow(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
  expect(pageWindow(10, 10)).toEqual([1, null, 7, 8, 9, 10]);
});

it("shows page info, marks the current page and disables previous on page 1", () => {
  render(<Pagination currentPage={1} totalPages={5} buildHref={(p) => `/x?page=${p}`} />);
  expect(screen.getByText(/Page/).textContent).toBe("Page 1 of 5");
  expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

it("keeps a non-default page size in every link and offers the size select", () => {
  render(<Pagination currentPage={2} totalPages={3} pageSize={20} buildHref={(p) => `/x?q=lodge&page=${p}`} />);
  expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/x?q=lodge&page=3&perPage=20");
  expect(screen.getByRole("combobox", { name: "Rows per page" })).toHaveValue("20");
});

it("renders nothing for a single page without a size select", () => {
  const { container } = render(<Pagination currentPage={1} totalPages={1} buildHref={() => "/x"} />);
  expect(container).toBeEmptyDOMElement();
});
