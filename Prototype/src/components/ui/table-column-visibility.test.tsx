import { fireEvent, render, screen } from "@testing-library/react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./table";
import { TablePreferencesProvider, tableColumnsStorageKey } from "./table-column-visibility";

const storageKey = tableColumnsStorageKey("alice", "bookings");
function Example({ userId = "alice", tableId = "bookings", extra = false, empty = false }: {userId?: string; tableId?: string; extra?: boolean; empty?: boolean}) {
  return <TablePreferencesProvider userId={userId}><Table tableId={tableId} aria-label="Bookings">
    <TableHeader><TableRow><TableHead>Reference</TableHead>{extra && <TableHead>Phone</TableHead>}<TableHead>Email</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
    <TableBody>{empty ? <TableRow><TableCell colSpan={3}>No rows</TableCell></TableRow> : <TableRow><TableCell>BK-1</TableCell>{extra && <TableCell>0700000000</TableCell>}<TableCell>guest@example.test</TableCell><TableCell>UGX 100</TableCell></TableRow>}</TableBody>
  </Table></TablePreferencesProvider>;
}
function open() {fireEvent.keyDown(screen.getByRole("button", {name:"Columns for Bookings"}),{key:"Enter"});}
function hide(label:string) {fireEvent.click(screen.getByRole("menuitemcheckbox",{name:label}));}
function close() {fireEvent.keyDown(screen.getByRole("menu"),{key:"Escape"});}
beforeEach(()=>{localStorage.clear();});
afterEach(()=>jest.restoreAllMocks());

test("all columns start visible; hiding one updates header, cells, and saved preferences",()=>{
  render(<Example />);
  expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  open();expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(3);
  expect(screen.getByRole("menuitemcheckbox",{name:"Email"})).toHaveAttribute("aria-checked","true");
  hide("Email");expect(screen.getByRole("menuitemcheckbox",{name:"Email"})).toHaveAttribute("aria-checked","false");
  close();expect(screen.queryByRole("columnheader",{name:"Email"})).not.toBeInTheDocument();
  expect(screen.queryByRole("cell",{name:"guest@example.test"})).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(["email"]);
});
test("choices survive remount and remain separate for another user or table",()=>{
  const first=render(<Example />);open();hide("Email");close();first.unmount();
  const next=render(<Example />);expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  next.rerender(<Example userId="bob" />);expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  next.rerender(<Example tableId="payments" />);expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  next.rerender(<Example />);expect(screen.getAllByRole("columnheader")).toHaveLength(2);
});
test("show all restores every column and removes the saved exclusions",()=>{
  localStorage.setItem(storageKey,JSON.stringify(["email"]));render(<Example />);open();
  fireEvent.click(screen.getByRole("menuitem",{name:"Show all columns"}));
  expect(screen.getAllByRole("columnheader")).toHaveLength(3);expect(localStorage.getItem(storageKey)).toBeNull();
});
test("the last visible column cannot be hidden",()=>{
  render(<Example />);open();hide("Reference");hide("Email");
  expect(screen.getByRole("menuitemcheckbox",{name:"Amount"})).toHaveAttribute("aria-disabled","true");
  hide("Amount");close();expect(screen.getAllByRole("columnheader")).toHaveLength(1);
});
test("new and reordered columns stay visible without changing saved choices",()=>{
  localStorage.setItem(storageKey,JSON.stringify(["email"]));const view=render(<Example />);
  view.rerender(<Example extra />);
  expect(screen.getByRole("columnheader",{name:"Phone"})).toBeInTheDocument();
  expect(screen.queryByRole("columnheader",{name:"Email"})).not.toBeInTheDocument();
  expect(screen.getByRole("cell",{name:"0700000000"})).toBeInTheDocument();
  expect(screen.queryByRole("cell",{name:"guest@example.test"})).not.toBeInTheDocument();
});
test.each(["invalid JSON",JSON.stringify(["reference","email","amount"])])("invalid preferences never blank the table: %s",value=>{
  localStorage.setItem(storageKey,value);render(<Example />);expect(screen.getAllByRole("columnheader")).toHaveLength(3);
});
test("empty-state cells span the visible columns",()=>{
  localStorage.setItem(storageKey,JSON.stringify(["email"]));render(<Example empty />);
  expect(screen.getByRole("cell",{name:"No rows"})).toHaveAttribute("colspan","2");
});
test("blocked browser storage still allows choices for the current visit",()=>{
  jest.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("Storage blocked");});
  render(<Example />);open();hide("Email");close();
  expect(screen.getAllByRole("columnheader")).toHaveLength(2);expect(screen.getByText(/Column choices apply for this visit/)).toBeInTheDocument();
});
test("changes in another tab are restored without overwriting storage",()=>{
  render(<Example />);
  fireEvent(window,new StorageEvent("storage",{key:storageKey,newValue:JSON.stringify(["amount"])}));
  expect(screen.queryByRole("columnheader",{name:"Amount"})).not.toBeInTheDocument();
});
