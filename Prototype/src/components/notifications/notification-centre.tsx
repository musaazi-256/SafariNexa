import { PortalToolbar } from "@/components/portal-toolbar";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { NotificationType, Prisma } from "@prisma/client";
import { Bell, BellOff, CalendarCheck, CreditCard, LifeBuoy, Settings, ShieldAlert, Star, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, parsePreferences } from "@/lib/preferences";
import { notificationDestination, NOTIFICATION_PATHS, type NotificationSurface } from "@/lib/notification-policy";
import { markNotificationRead, markAllNotificationsRead, openNotification } from "@/lib/actions/notifications";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/page-pagination";
import { RecordFilter } from "@/components/record-filter";
import { PortalSearch } from "@/components/portal-search";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {BOOKING_UPDATE: CalendarCheck, PAYMENT_UPDATE: CreditCard, REVIEW_PROMPT: Star, SUPPORT_UPDATE: LifeBuoy, SAFETY_ADVISORY: ShieldAlert, SYSTEM: Settings};
const FILTERS = [{value:"all",label:"All categories"}, {value:"following",label:"My categories"}, ...NOTIFICATION_TYPES.map(value=>({value,label:NOTIFICATION_TYPE_LABELS[value]}))];
export type NotificationSearch = {filter?: string; read?: string; q?: string; page?: string};

export async function NotificationCentre({ userId, surface, searchParams }: {userId: string; surface: NotificationSurface; searchParams: NotificationSearch}) {
  const path = NOTIFICATION_PATHS[surface];
  if (searchParams.filter === "unread") {
    const canonical = new URLSearchParams({read:"unread",...(searchParams.q?{q:searchParams.q}:{}),...(searchParams.page?{page:searchParams.page}:{})});
    redirect(`${path}?${canonical}`);
  }
  const filter = FILTERS.some(item=>item.value===searchParams.filter) ? searchParams.filter! : "all";
  const read = searchParams.read === "unread" ? "unread" : "all";
  const q = searchParams.q?.trim() ?? "";
  const page = parsePage(searchParams.page);
  const [profile, memberships] = await Promise.all([
    db.customerProfile.findUnique({where:{userId},select:{preferences:true}}),
    db.businessUser.findMany({where:{userId},select:{businessId:true}})
  ]);
  const preferences = parsePreferences(profile?.preferences);
  const where: Prisma.NotificationWhereInput = {userId,
    ...(read==="unread"?{isRead:false}:{}),
    ...(filter==="following"?{type:{in:NOTIFICATION_TYPES.filter(type=>preferences.notify[type])}}:NOTIFICATION_TYPES.includes(filter as NotificationType)?{type:filter as NotificationType}:{}),
    ...(q?{OR:[{title:{contains:q,mode:"insensitive"}},{body:{contains:q,mode:"insensitive"}}]}:{})};
  const [notifications,totalCount,unreadCount] = await Promise.all([
    db.notification.findMany({where,include:{relatedBooking:{select:{id:true,customerId:true,businessId:true,business:{select:{name:true}}}},supportCase:{select:{id:true,surface:true,openedByUserId:true}}},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE}),
    db.notification.count({where}), db.notification.count({where:{userId,isRead:false}})
  ]);
  function hrefFor(nextFilter: string, nextPage?: number) {
    const params=new URLSearchParams({...(nextFilter!=="all"?{filter:nextFilter}:{}),...(q?{q}:{}),...(read!=="all"?{read}:{}),...(nextPage?{page:String(nextPage)}:{})});
    return `${path}${params.size?`?${params}`:""}`;
  }
  const fields = (id?: string) => <><input type="hidden" name="surface" value={surface}/>{id&&<input type="hidden" name="notificationId" value={id}/>}</>;
  return <div className="space-y-5">
    {surface==="admin"&&<div className="flex flex-wrap gap-3 text-sm"><Link className="text-primary underline underline-offset-4" href="/admin/verification">Verification queue</Link><Link className="text-primary underline underline-offset-4" href="/admin/listings">Listing reviews</Link><Link className="text-primary underline underline-offset-4" href="/admin/support">Support cases</Link></div>}
    <p role="status" className="text-sm text-muted-foreground">{unreadCount} unread {unreadCount===1?"notification":"notifications"}</p>
    <PortalToolbar
      search={<PortalSearch label="Search notifications" placeholder="Search notifications…"/>}
      filters={<>
        <RecordFilter label="Read status" name="read" value={read} defaultValue="all" options={[{value:"all",label:"All updates"},{value:"unread",label:"Unread",count:unreadCount}]} />
        <RecordFilter label="Category" name="filter" value={filter} defaultValue="all" options={FILTERS} />
      </>}
      actions={<>{surface!=="admin"&&<Link className="text-sm text-primary underline underline-offset-4" href={surface==="business"?"/business/messages":"/profile/messages"}>Messages</Link>}<form action={markAllNotificationsRead}>{fields()}<Button type="submit" variant="outline" size="sm" disabled={!unreadCount}>Mark all as read</Button></form></>}
    />
    {filter==="following"&&<p className="text-sm text-muted-foreground leading-relaxed">Showing the categories selected in <Link className="text-primary underline underline-offset-4" href="/profile/preferences">your account preferences</Link>. Your category selection combines with read status. Choose All categories to include every category.</p>}
    {notifications.length===0?<EmptyState icon={BellOff} title="No notifications found" description={q||filter!=="all"||read!=="all"?"Try another search or category. Your other updates are still available under All.":"Updates sent to your account will appear here."}/>:<div className="space-y-3">{notifications.map(notification=>{
      const Icon=TYPE_ICON[notification.type]??Bell;
      const destination=notificationDestination(notification,{userId,surface,businessIds:memberships.map(member=>member.businessId)});
      return <Card key={notification.id} className="overflow-hidden"><CardContent className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Icon className="h-4 w-4" aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs text-muted-foreground">{NOTIFICATION_TYPE_LABELS[notification.type]}</p>{!notification.isRead&&<span className="rounded bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary">Unread</span>}</div><h2 className="mt-1 break-words text-sm font-semibold text-slate-800">{notification.title}</h2><p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{notification.body}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground"><time dateTime={notification.createdAt.toISOString()}>{notification.createdAt.toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Kampala"})} EAT</time>{notification.relatedBooking&&<span>{notification.relatedBooking.business.name}</span>}</div><div className="mt-3 flex flex-wrap items-center gap-2">{destination&&<form action={openNotification}>{fields(notification.id)}<Button type="submit" aria-label={`${destination.label}: ${notification.title}`} variant="link" size="sm" className="h-auto p-0 text-xs underline">{destination.label}<ArrowUpRight aria-hidden="true"/></Button></form>}{!notification.isRead&&<form action={markNotificationRead}>{fields(notification.id)}<Button type="submit" aria-label={`Mark ${notification.title} as read`} variant="ghost" size="sm" className="h-8 text-xs">Mark as read</Button></form>}</div></div></CardContent></Card>;
    })}</div>}
    <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={p=>hrefFor(filter,p)}/>
  </div>;
}
