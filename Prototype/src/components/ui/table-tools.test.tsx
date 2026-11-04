import {fireEvent,render,screen} from "@testing-library/react";
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from "./table";
import {TablePreferencesProvider} from "./table-column-visibility";
import {PortalToolbar} from "@/components/portal-toolbar";
import {tableToCsv} from "./table-export";

it("places both icon actions in the table's existing toolbar, without a second row",()=>{
  render(<TablePreferencesProvider userId="me"><PortalToolbar tableId="payments" search={<input aria-label="Search payments"/>}/><Table tableId="payments" aria-label="Payments" externalTools><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Email</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>BK-1</TableCell><TableCell>me@example.test</TableCell></TableRow></TableBody></Table></TablePreferencesProvider>);
  const exportButton=screen.getByRole("button",{name:"Export Payments to CSV"}),columns=screen.getByRole("button",{name:"Columns for Payments"});
  expect(exportButton.parentElement).toBe(columns.parentElement);
  expect(columns.closest(".portal-toolbar")).toContainElement(screen.getByRole("textbox",{name:"Search payments"}));
  expect(document.querySelectorAll(".portal-toolbar")).toHaveLength(1);
  expect(exportButton.textContent).toBe("");expect(columns.textContent).toBe("");
  fireEvent.keyDown(columns,{key:"Enter"});fireEvent.click(screen.getByRole("menuitemcheckbox",{name:"Email"}));fireEvent.keyDown(screen.getByRole("menu"),{key:"Escape"});
  expect(screen.queryByRole("columnheader",{name:"Email"})).not.toBeInTheDocument();
});
it("exports only the selected table and visible columns, with escaped spreadsheet content",()=>{
  document.body.innerHTML='<table id="first"><thead><tr><th>Reference</th><th hidden>Email</th><th>Amount</th></tr></thead><tbody><tr><td>=formula</td><td hidden>private@example.test</td><td>UGX 100</td></tr></tbody></table><table><tbody><tr><td>Other table</td></tr></tbody></table>';
  expect(tableToCsv(document.querySelector<HTMLTableElement>("#first")!)).toBe('"Reference","Amount"\r\n"\'=formula","UGX 100"');
  document.body.innerHTML="";
});
