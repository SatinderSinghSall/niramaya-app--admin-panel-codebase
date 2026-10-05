"use client";

import AdminHero from "@/components/public/AdminHero";
import CapabilitiesSection from "@/components/public/CapabilitiesSection";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNavbar from "@/components/public/PublicNavbar";

export default function AdminLandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f7] text-[#17221d]">
      <PublicNavbar />

      <AdminHero />

      <CapabilitiesSection />

      <PublicFooter />
    </main>
  );
}
