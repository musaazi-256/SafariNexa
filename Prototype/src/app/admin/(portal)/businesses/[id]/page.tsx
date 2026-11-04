import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RemoteImage } from "@/components/remote-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ChevronLeft, MapPin, Mail, Phone, Users, FileText, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { toVerificationStatus } from "@/lib/status";
import { formatUGX } from "@/lib/booking";

export default async function AdminBusinessProfilePage({ params }: { params: { id: string } }) {
  await requireAdminSession();

  const business = await db.businessProfile.findUnique({
    where: { id: params.id },
    include: {
      users: { include: { user: true } },
      verifications: { orderBy: { createdAt: "desc" } },
      listings: true,
      bookings: true,
    }
  });

  if (!business) {
    notFound();
  }

  const totalRevenue = business.bookings
    .filter((b) => ["CONFIRMED","COMPLETED","REVIEW_PENDING","REVIEWED"].includes(b.status))
    .reduce((acc, b) => acc + b.totalMinor, 0);

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Back Link */}
      <Link href="/admin/businesses" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to businesses
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden p-8 flex flex-col sm:flex-row gap-8 items-start relative">
        <div className="absolute top-8 right-8">
          <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
        </div>
        
        <div className="h-24 w-24 rounded-2xl bg-[#E4F2E8] border border-[#1e613c]/20 flex items-center justify-center shrink-0">
          {business.logoUrl ? (
             <RemoteImage src={business.logoUrl} alt={business.name} className="h-full w-full object-cover rounded-2xl" />
          ) : (
            <Building2 className="h-10 w-10 text-[#1e613c]" />
          )}
        </div>
        
        <div className="flex-1">
          <PageHeader title={<>{business.name}</>} description={<>{business.type.replace("_", " ")}</>} />
          
          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              {business.city ? `${business.city}, ` : ""}{business.country}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              {business.contactEmail}
            </div>
            {business.contactPhone && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {business.contactPhone}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">About this business</h2>
            <p className="text-sm leading-relaxed text-slate-600 font-medium">
              {business.description || "No description provided."}
            </p>
          </div>
          
          {/* Listings */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900">Listings ({business.listings.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {business.listings.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-slate-500">No listings created yet.</div>
              ) : (
                business.listings.map((l) => (
                  <div key={l.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-900">{l.title}</span>
                      <span className="text-xs font-medium text-slate-500 capitalize">{l.type.replace("_", " ")}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium uppercase tracking-wider">{l.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          <section aria-label="Business performance" className="space-y-4">
            <StatCard label="Confirmed booking value" value={formatUGX(totalRevenue)} description="Confirmed and completed bookings · all time" help="Sum of confirmed, completed and reviewed booking totals for this business. This is booking value rather than recorded payment revenue." />
            <StatCard label="Total bookings" value={business.bookings.length} description="All booking states · all time" />
          </section>

          {/* Staff Members */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                Staff Members
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {business.users.map((bu) => (
                <div key={bu.id} className="p-4 flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-900">{bu.user.name || "Unnamed User"}</span>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 truncate">{bu.user.email}</span>
                    <span className="text-xs font-medium uppercase tracking-widest text-[#1e613c] bg-[#E4F2E8] px-2 py-0.5 rounded-sm">{bu.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verifications */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="border-b border-border px-6 py-4 bg-slate-50/50">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Verification History
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {business.verifications.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-slate-500">No verifications submitted.</div>
              ) : (
                business.verifications.map((v) => (
                  <Link key={v.id} href={`/admin/verification/${v.id}`} className="p-4 flex flex-col gap-1 hover:bg-slate-50 block transition-colors group">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">Request</span>
                      <VerificationStatusBadge status={toVerificationStatus(v.status)} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{v.createdAt.toLocaleDateString()}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
