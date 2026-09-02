import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Eye, LogOut, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { ProfileActionCard, ProfileActionLink, ProfileNotifications } from "@/components/site/profile-notifications";
import { ProfileMemberCard } from "@/components/site/profile-member-card";
import { ProfileOrderCard } from "@/components/site/profile-order-card";
import { ProfileRecentCarousel } from "@/components/site/profile-recent-carousel";
import { Button } from "@/components/ui/button";
import { useOrders, useProducts } from "@/lib/api-hooks";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/lib/require-auth";
import { getRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/profile")({
  head: () => {
    const seo = seoHead({
      title: "Your profile",
      description: "Your Blessings account, orders and saved looks.",
      path: "/profile",
      noindex: true,
    });
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap",
        },
      ],
    };
  },
  component: function ProfileRoute() {
    return (
      <RequireAuth from="/profile">
        <ProfilePage />
      </RequireAuth>
    );
  },
});

function ProfilePage() {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: catalog = [] } = useProducts();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentProduct[]>([]);

  useEffect(() => {
    document.title = "Your Profile | Blessings";
  }, []);

  useEffect(() => {
    setRecent(getRecentlyViewed());
    const onUpdate = () => setRecent(getRecentlyViewed());
    window.addEventListener("recently-viewed-updated", onUpdate);
    return () => window.removeEventListener("recently-viewed-updated", onUpdate);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center eyebrow text-[10px]">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isAdmin) {
    return <Navigate to="/admin/$tab" params={{ tab: "dashboard" }} />;
  }

  return (
    <div className="bg-[color:var(--ivory)]">
      <section className="relative isolate h-[280px] overflow-hidden sm:h-[340px] md:h-[380px]">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 size-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0908]/92 via-[#1a0908]/72 to-[#1a0908]/30" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col justify-center px-4 sm:px-6">
          <p className="eyebrow text-[10px] tracking-[0.32em] text-[color:var(--gold)]">
            Blessings membership
          </p>
          <h1 className="profile-display mt-3 text-4xl text-white italic sm:text-5xl md:text-[3.5rem]">
            Your Profile
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
            An atelier record of your details, live orders, and pieces you have been considering on this
            device.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pb-20">
        <div className="relative z-10 -mt-8 sm:-mt-10">
          <ProfileMemberCard user={user} />
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <ProfileActionLink
            to="/shop/$category"
            params={{ category: "all" }}
            icon={<ShoppingBag className="size-5" strokeWidth={1.5} />}
            kicker="Explore"
            title="View Collection"
          />
          <ProfileActionCard
            icon={<Eye className="size-5" strokeWidth={1.5} />}
            kicker="This Device"
            title="Recently Viewed"
            onClick={() => navigate({ to: "/profile", hash: "recently-viewed" })}
          />
          <ProfileActionLink
            to="/bespoke"
            icon={<CalendarDays className="size-5" strokeWidth={1.5} />}
            kicker="Atelier"
            title="Book Appointment"
          />
          <ProfileNotifications />
        </section>

        <section id="orders" className="mt-16 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-[10px] tracking-[0.28em] text-[color:var(--gold)]">Orders</p>
              <h2 className="profile-display mt-2 text-3xl italic sm:text-4xl">My Orders</h2>
            </div>
            {orders.length > 0 ? (
              <p className="text-xs text-foreground/50">
                {orders.length} order{orders.length === 1 ? "" : "s"} · tap a row for details
              </p>
            ) : null}
          </div>

          {ordersLoading ? (
            <p className="mt-8 eyebrow text-[10px]">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center shadow-[0_10px_32px_rgba(40,16,10,0.06)]">
              <div className="mx-auto mb-5 flex size-[4.5rem] items-center justify-center rounded-full bg-[color:var(--gold)]/12">
                <ShoppingBag className="size-7 text-[color:var(--gold)]" strokeWidth={1.4} />
              </div>
              <p className="profile-display text-2xl italic">No orders yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/55">
                When you place an order, live status will appear here.
              </p>
              <Button
                asChild
                className="mt-8 h-11 rounded-full bg-[color:var(--maroon)] px-8 hover:bg-[color:var(--maroon)]/90"
              >
                <Link to="/shop/$category" params={{ category: "all" }}>
                  Shop Collection
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 divide-y divide-foreground/10 overflow-hidden rounded-2xl bg-white shadow-[0_10px_32px_rgba(40,16,10,0.06)]">
              {orders.map((order, i) => (
                <ProfileOrderCard key={order.id} order={order} defaultOpen={orders.length === 1 && i === 0} />
              ))}
            </div>
          )}
        </section>

        <section id="recently-viewed" className="mt-16 scroll-mt-28">
          <ProfileRecentCarousel recent={recent} catalog={catalog} />
        </section>

        <div className="mt-16 flex justify-center border-t border-[color:var(--gold)]/20 pt-10">
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/45 bg-white px-6 py-2.5 text-sm text-[color:var(--gold)] shadow-sm transition-colors hover:border-[color:var(--gold)] hover:bg-[color:var(--ivory)]"
          >
            <LogOut className="size-4" strokeWidth={1.6} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}