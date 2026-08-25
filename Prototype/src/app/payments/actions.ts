"use server";

import { redirect } from "next/navigation";
import { PaymentProvider } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { maskLast4 } from "@/lib/payments";

export async function processPaymentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orderId = String(formData.get("orderId") ?? "").trim() || undefined;
  const bookingId = String(formData.get("bookingId") ?? "").trim() || undefined;
  const method = String(formData.get("method") ?? "mtn").toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const cardName = String(formData.get("cardName") ?? "").trim();
  const cardNumber = String(formData.get("cardNumber") ?? "").trim();

  if (!orderId && !bookingId) {
    throw new Error("Missing order or booking reference for payment.");
  }

  let provider: PaymentProvider = "MTN_MOBILE_MONEY";
  if (method === "airtel") provider = "AIRTEL_MONEY";
  if (method === "card") provider = "CARD";
  if (method === "stripe") provider = "STRIPE";

  const rawReference = phone || cardNumber || cardName || "0000";
  const maskedRef = maskLast4(rawReference);
  const providerRef = `${provider}_${Date.now()}_${maskedRef.replace(/\s+/g, "")}`;

  if (orderId) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { bookings: true }
    });

    if (!order || order.customerId !== session.user.id) {
      throw new Error("Order not found or unauthorized.");
    }

    // Update order and bookings status to CONFIRMED
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" }
      });

      await tx.booking.updateMany({
        where: { orderId: orderId },
        data: { status: "CONFIRMED" }
      });

      await tx.payment.create({
        data: {
          orderId: orderId,
          provider: provider,
          status: "SUCCESSFUL",
          amountMinor: order.totalMinor,
          currency: "UGX",
          providerReference: providerRef,
          completedAt: new Date()
        }
      });
    });

    redirect(`/payments/receipt?orderId=${orderId}`);
  } else if (bookingId) {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.customerId !== session.user.id) {
      throw new Error("Booking not found or unauthorized.");
    }

    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" }
      });

      await tx.payment.create({
        data: {
          bookingId: bookingId,
          provider: provider,
          status: "SUCCESSFUL",
          amountMinor: booking.totalMinor,
          currency: "UGX",
          providerReference: providerRef,
          completedAt: new Date()
        }
      });
    });

    redirect(`/payments/receipt?bookingId=${bookingId}`);
  }
}
