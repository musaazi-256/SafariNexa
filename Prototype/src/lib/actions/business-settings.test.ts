import { updateBusinessProfile } from "./business-settings";
import { db } from "@/lib/db";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("@/lib/business", () => ({ requireBusinessSession: jest.fn().mockResolvedValue({ businessId: "business", business: { logoUrl: null, coverImageUrl: null }, session: { user: { id: "owner", email: "owner@safarinexa.test" } } }) }));
jest.mock("@/lib/db", () => ({ db: { businessUser: { findFirst: jest.fn() }, listingImageUpload: { findUnique: jest.fn() }, businessProfile: { update: jest.fn() } } }));
const mock = db as unknown as { businessUser: { findFirst: jest.Mock }; listingImageUpload: { findUnique: jest.Mock }; businessProfile: { update: jest.Mock } };
const image = "/api/images/00000000-0000-4000-8000-000000000000.png";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: "Business", email: "owner@safarinexa.test", phone: "0770000000", address: "Kampala Road", city: "Kampala", country: "Uganda", description: "A business profile", coverImageUrl: image, logoUrl: "", registrationNumber: "REG-123", contactName: "Business contact", contactRole: "Manager" })) data.set(key, value);
  return data;
}
beforeEach(() => { jest.clearAllMocks(); mock.businessUser.findFirst.mockResolvedValue({ role: "OWNER" }); mock.listingImageUpload.findUnique.mockResolvedValue({ uploadedBy: "owner" }); });
test("owned cover upload and collected verification contact fields persist to the business profile", async () => {
  await updateBusinessProfile(form());
  expect(mock.businessProfile.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "business" }, data: expect.objectContaining({ coverImageUrl: image, logoUrl: null, registrationNumber: "REG-123", contactName: "Business contact", contactRole: "Manager" }) }));
});
test("a different user's upload cannot be attached as business branding", async () => {
  mock.listingImageUpload.findUnique.mockResolvedValue({ uploadedBy: "other-owner" });
  await expect(updateBusinessProfile(form())).rejects.toThrow("Upload an image from your account");
  expect(mock.businessProfile.update).not.toHaveBeenCalled();
});
test("a removed cover is cleared and absent branding fields preserve existing data", async () => {
  const cleared = form(); cleared.set("coverImageUrl", ""); await updateBusinessProfile(cleared);
  expect(mock.businessProfile.update.mock.calls[0][0].data.coverImageUrl).toBeNull();
  const unchanged = form(); unchanged.delete("coverImageUrl"); unchanged.delete("logoUrl"); await updateBusinessProfile(unchanged);
  expect(mock.businessProfile.update.mock.calls[1][0].data).not.toHaveProperty("coverImageUrl");
});
