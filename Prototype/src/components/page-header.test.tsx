import {render,screen} from "@testing-library/react";
import {PageHeader} from "./page-header";
import {PageHero} from "./page-hero";

it("keeps navigation, the page title, description, and actions in one header",()=>{
  render(<PageHeader title="Upcoming booking calendar" description="Scheduled bookings." back={{href:"/business/bookings",label:"Back to bookings"}} actions={<button>Export</button>} />);
  expect(screen.getAllByRole("heading",{level:1})).toHaveLength(1);
  expect(screen.getByRole("heading",{name:"Upcoming booking calendar"})).toHaveClass("type-page");
  expect(screen.getByRole("link",{name:"Back to bookings"})).toHaveAttribute("href","/business/bookings");
  expect(screen.getByRole("button",{name:"Export"}).closest('[data-slot="page-header"]')).toBeInTheDocument();
});
it("the existing portal hero uses the same header and retains status announcements",()=>{
  render(<PageHero variant="portal" title="Bookings" description="Review your bookings."/>);
  expect(screen.getByRole("heading",{level:1})).toHaveAttribute("data-slot","page-title");
  expect(screen.getByText("Review your bookings.").closest('[data-slot="page-header"]')).toBeInTheDocument();
});
it("image headers preserve readable text and dynamic status descriptions stay live",()=>{
  render(<PageHeader tone="inverse" title="Your business" description="Payment pending" descriptionRole="status" />);
  expect(screen.getByRole("heading",{level:1})).toHaveClass("text-white");
  expect(screen.getByRole("status")).toHaveTextContent("Payment pending");
});
