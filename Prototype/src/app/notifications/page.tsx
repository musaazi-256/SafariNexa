import Link from "next/link";
import { redirect } from "next/navigation";
import type { NotificationType } from "@prisma/client";
import { Bell, BellOff, CalendarCheck, CreditCard, LifeBuoy, Settings, ShieldAlert, Star } from "lucide-react";

import { auth } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  BOOKING_UPDATE: CalendarCheck,
  PAYMENT_UPDATE: CreditCard,
  REVIEW_PROMPT: Star,
  SUPPORT_UPDATE: LifeBuoy,
  SAFETY_ADVISORY: ShieldAlert,
  SYSTEM: Settings
};

const TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "BOOKING_UPDATE", label: "Bookings" },
  { value: "PAYMENT_UPDATE", label: "Payments" },
  { value: "SUPPORT_UPDATE", label: "Support" },
  { value: "SAFETY_ADVISORY", label: "Safety" }
];

export default async function NotificationsPage({ searchParams }: { searchParams: { filter?: string; page?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fnotifications");

  const filter = searchParams.filter ?? "all";
  const page = parsePage(searchParams.page);
  const where =
    filter === "unread"
      ? { userId: session.user.id, isRead: false }
      : filter !== "all"
        ? { userId: session.user.id, type: filter as NotificationType }
        : { userId: session.user.id };

  const [notifications, totalCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.notification.count({ where })
  ]);

  async function markRead(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fnotifications");

    const notificationId = String(formData.get("notificationId"));
    await db.notification.updateMany({
      where: { id: notificationId, userId: activeSession.user.id },
      data: { isRead: true }
    });
  }

  async function markAllRead() {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fnotifications");

    await db.notification.updateMany({
      where: { userId: activeSession.user.id, isRead: false },
      data: { isRead: true }
    });
  }

  return (
    <AccountLayout
      eyebrow="Account"
      title="Notification centre"
      description="Booking updates, payment receipts, reminders, and safety alerts."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-2 rounded-2xl">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const isActive = filter === tab.value;
            const href = tab.value === "all" ? "/notifications" : `/notifications?filter=${tab.value}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive ? "bg-brand-green text-white shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form action={markAllRead}>
          <Button type="submit" variant="ghost" size="sm" className="font-bold">
            Mark all as read
          </Button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="Nothing here" description="Nothing matches this filter right now." />
      ) : (
        <div className="flex flex-col gap-4">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type];
            const href = notification.relatedBookingId
              ? `/bookings/${notification.relatedBookingId}`
              : notification.relatedSupportCaseId
                ? `/support/${notification.relatedSupportCaseId}`
                : null;

            return (
              <Card key={notification.id} className={cn("relative overflow-hidden border-none shadow-sm rounded-2xl transition-all", !notification.isRead ? "bg-brand-green/5" : "bg-card")}>
                {href ? <Link href={href} className="absolute inset-0 z-10" aria-label={notification.title} /> : null}
                <CardContent className="flex items-start gap-4 pt-6 pb-6">
                  <span className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    !notification.isRead ? "bg-brand-green text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className={cn("font-bold text-lg", !notification.isRead && "text-brand-green")}>{notification.title}</h2>
                      {!notification.isRead ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" /> : null}
                    </div>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{notification.body}</p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                      {notification.createdAt.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <form action={markRead} className="relative z-20 shrink-0 ml-4">
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <Button type="submit" variant="ghost" size="sm" className="h-8">
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={totalPagesFor(totalCount)}
          buildHref={(p) => `/notifications?${new URLSearchParams({ ...(filter !== "all" ? { filter } : {}), page: String(p) }).toString()}`}
        />
      </div>
    </AccountLayout>
  );
}
