import { sendMessage, sendBookingInquiryAction, sendListingInquiryAction } from "./messages";

jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: "user-123", name: "Test User" }
  })
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn()
}));

jest.mock("@/lib/db", () => ({
  db: {
    messageThread: {
      findUnique: jest.fn().mockResolvedValue({
        id: "thread-1",
        businessId: "biz-1",
        customerId: "user-123",
        bookingId: "booking-1"
      }),
      findFirst: jest.fn().mockResolvedValue({
        id: "thread-1",
        businessId: "biz-1",
        customerId: "user-123",
        bookingId: "booking-1"
      }),
      create: jest.fn().mockResolvedValue({
        id: "thread-1",
        businessId: "biz-1",
        customerId: "user-123",
        bookingId: "booking-1"
      }),
      update: jest.fn().mockResolvedValue({})
    },
    message: {
      create: jest.fn().mockResolvedValue({
        id: "msg-1",
        threadId: "thread-1",
        senderId: "user-123",
        content: "Hello there!",
        createdAt: new Date()
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    booking: {
      findUnique: jest.fn().mockResolvedValue({
        id: "booking-1",
        businessId: "biz-1",
        customerId: "user-123"
      })
    },
    listing: {
      findUnique: jest.fn().mockResolvedValue({
        id: "listing-1",
        title: "Safari Lodge",
        businessId: "biz-1"
      })
    },
    businessUser: {
      findFirst: jest.fn().mockResolvedValue({
        id: "bu-1",
        businessId: "biz-1",
        userId: "user-123"
      })
    }
  }
}));

describe("Message Actions", () => {
  it("sends a message to an existing thread", async () => {
    const msg = await sendMessage("thread-1", "Hello there!");
    expect(msg).toBeDefined();
    expect(msg.content).toBe("Hello there!");
  });

  it("sends a booking inquiry", async () => {
    const msg = await sendBookingInquiryAction("booking-1", "Need info");
    expect(msg).toBeDefined();
  });

  it("sends a listing inquiry", async () => {
    const msg = await sendListingInquiryAction("listing-1", "Is pool available?");
    expect(msg).toBeDefined();
  });
});
