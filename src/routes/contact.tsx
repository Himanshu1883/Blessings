import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Ruler,
  Shield,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { useScrollExperience } from "@/components/site/scroll-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { seoHead } from "@/lib/seo";
import { formatStoreAddress } from "@/lib/store-settings";
import { useStoreSettings } from "@/lib/store-settings-context";

export const Route = createFileRoute("/contact")({
  head: () =>
    seoHead({
      title: "Contact, Shipping & Help",
      description:
        "Reach Blessings The Men's Boutique on WhatsApp, phone, or email. Book a fitting, ask about an order, or read shipping and size-guide help.",
      path: "/contact",
    }),
  component: Contact,
});

const JUMP_LINKS = [
  { id: "contact", label: "Contact" },
  { id: "atelier", label: "Atelier" },
  { id: "shipping", label: "Shipping" },
  { id: "help", label: "Help" },
] as const;

const TOPICS = ["Bespoke consultation", "An order", "Shipping", "Sizing", "Other"] as const;

const FAQS = [
  {
    q: "How long does a ready piece take to ship?",
    a: "Ready pieces usually dispatch within 3–5 working days. International express typically arrives in 4–8 days after dispatch, depending on customs.",
  },
  {
    q: "Do you offer made-to-measure?",
    a: "Yes. Book a private consultation in store or a virtual fitting on WhatsApp or Zoom. Bespoke pieces are patterned on your block and finished over about 30 days.",
  },
  {
    q: "How do I find my size?",
    a: "Each product page includes a size chart. If you are between sizes or dressing for a wedding, message the concierge with your chest, waist and height — we will recommend a size or a bespoke path.",
  },
  {
    q: "Can I track my order?",
    a: "Once dispatched, tracking is sent by email and WhatsApp. You can also open Orders from your account after signing in.",
  },
  {
    q: "How should I care for embroidery and silk?",
    a: "Dry-clean only. Store on a wide hanger, away from direct sun. Do not steam embroidered panels at close range. A care card ships with every piece.",
  },
] as const;

function Contact() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const { lenis } = useScrollExperience();
  const settings = useStoreSettings();
  const [name, setName] = useState("");
  const [reach, setReach] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Bespoke consultation");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset: -96, duration: 0.85 });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, lenis]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Please add your name and a short message.");
      return;
    }
    const body = [
      `Hi Blessings, this is ${name.trim()}.`,
      reach.trim() ? `Reach me on ${reach.trim()}.` : "",
      `Topic: ${topic}.`,
      message.trim(),
    ]
      .filter(Boolean)
      .join(" ");
    window.open(settings.whatsappUrl(body), "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp with your message.");
  };

  return (
    <div className="bg-[color:var(--ivory)]">
      <section className="border-b border-foreground/10">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20 md:px-8 md:py-24">
          <p className="eyebrow mb-4 text-[color:var(--gold)]">The Concierge</p>
          <h1 className="font-serif max-w-3xl text-balance text-3xl italic leading-tight sm:text-5xl md:text-6xl">
            We’re here — in the boutique, and wherever you are.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-foreground/65 sm:text-base">
            Visit the atelier, book a virtual fitting, or write to the house about an order or a wedding brief.
            Shipping and help live on this page.
          </p>
        </div>
        <nav className="sticky top-[var(--header-height)] z-20 border-t border-foreground/10 bg-[color:var(--ivory)]/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-3 sm:px-6 md:px-8">
            {JUMP_LINKS.map((item) => (
              <Link
                key={item.id}
                to="/contact"
                hash={item.id}
                className="shrink-0 rounded-full px-4 py-2 eyebrow text-[9px] tracking-[0.16em] text-foreground/55 transition-colors hover:bg-white hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </section>

      <section
        id="contact"
        className="scroll-mt-[calc(var(--header-height)+4.5rem)] mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 md:px-8"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-10">
            <div>
              <p className="eyebrow mb-3 text-[color:var(--gold)]">Write to us</p>
              <h2 className="font-serif text-3xl italic sm:text-4xl">A note to the atelier.</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                Messages go straight to the Blessings concierge on WhatsApp — usually answered the same working day.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <MessageCircle className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">WhatsApp</p>
                  <WhatsAppLink message={WHATSAPP_MESSAGES.general} className="mt-1 text-sm hover:text-[#25D366]">
                    {settings.whatsappDisplay}
                  </WhatsAppLink>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <Mail className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">Email</p>
                  <a href={`mailto:${settings.email}`} className="mt-1 block text-sm hover:text-[color:var(--maroon)]">
                    {settings.email}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <Phone className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">Phone</p>
                  <a href={`tel:${settings.landline}`} className="mt-1 block text-sm hover:text-[color:var(--maroon)]">
                    {settings.landlineDisplay}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <Clock className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">Hours</p>
                  <p className="mt-1 text-sm text-foreground/70">{settings.hours}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="lg:col-span-7 space-y-4 rounded-2xl border border-foreground/10 bg-white p-5 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-full h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-reach">Email or phone</Label>
                <Input id="contact-reach" value={reach} onChange={(e) => setReach(e.target.value)} className="rounded-full h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-topic">Topic</Label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])}
                className="flex h-11 w-full rounded-full border border-input bg-transparent px-3 text-sm"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-2xl"
                placeholder="Tell us about the occasion, the piece, or the help you need."
              />
            </div>
            <Button
              type="submit"
              className="h-11 rounded-full bg-[color:var(--charcoal)] px-6 eyebrow text-[9px] tracking-[0.18em] text-[color:var(--ivory)] hover:bg-[color:var(--maroon)]"
            >
              Send on WhatsApp
              <ArrowRight className="size-3.5" />
            </Button>
          </form>
        </div>
      </section>

      <section
        id="atelier"
        className="scroll-mt-[calc(var(--header-height)+4.5rem)] border-y border-foreground/10 bg-white"
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:px-8 md:gap-16">
          <div>
            <p className="eyebrow mb-3 text-[color:var(--gold)]">Atelier</p>
            <h2 className="font-serif text-3xl italic sm:text-4xl">Visit the boutique.</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/65">
              Private viewings by walk-in or appointment. Bring a reference, a date, or simply come to feel the silks.
              Virtual fittings are available for the UK, USA, UAE, Canada and beyond.
            </p>
            {formatStoreAddress(settings) ? (
              <p className="mt-4 whitespace-pre-line text-sm text-foreground/70">{formatStoreAddress(settings)}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-2">
              <WhatsAppLink
                message={WHATSAPP_MESSAGES.book}
                className="inline-flex h-10 items-center rounded-full bg-[color:var(--gold)] px-5 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--charcoal)] hover:bg-[color:var(--gold-soft)]"
              >
                Book a visit
              </WhatsAppLink>
              <Link
                to="/bespoke"
                className="inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 eyebrow text-[9px] tracking-[0.16em] hover:border-[color:var(--gold)]"
              >
                The bespoke process
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["In person", "Try silhouettes, fabrics and embroidery in the fitting rooms. Alterations on the house for Blessings pieces."],
              ["Virtual", "WhatsApp or Zoom with a house stylist. We ship trial muslins for bespoke clients abroad when needed."],
              ["Weddings", "Groom, groomsmen and family edits. Share the function list and we will map a wardrobe."],
              ["Press & events", `For editorials and trunk shows, write to ${settings.email} with dates and city.`],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-foreground/10 p-5">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="shipping"
        className="scroll-mt-[calc(var(--header-height)+4.5rem)] border-y border-foreground/10 bg-white"
      >
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 md:px-8">
          <div className="flex items-start gap-4">
            <span className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-foreground/10 sm:flex">
              <Truck className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
            </span>
            <div className="max-w-3xl">
              <p className="eyebrow mb-3 text-[color:var(--gold)]">Shipping</p>
              <h2 className="font-serif text-3xl italic sm:text-4xl">To your door, worldwide.</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                {settings.shippingNote ||
                  "Complimentary worldwide shipping on every Blessings order. Duties and taxes for your country are shown at checkout where we can calculate them; otherwise they may be collected by local customs."}
              </p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Package, title: "Ready to wear", copy: "Dispatches in 3–5 working days after confirmation." },
              { Icon: Truck, title: "International express", copy: "Typically 4–8 days after dispatch to UK, USA, UAE, EU and Canada." },
              { Icon: Shield, title: "Insured", copy: "Every parcel is tracked and insured until it is in your hands." },
              { Icon: Clock, title: "Bespoke", copy: "Cut and finished in about 30 days, then shipped white-glove." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-foreground/10 p-5">
                <item.Icon className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                <h3 className="mt-4 font-medium">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{item.copy}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-foreground/60">
            Remote islands and some territories may take longer. If you need a piece for a fixed wedding date, tell us
            when you order — we will confirm a delivery window before we cut.
          </p>
          <WhatsAppLink
            message={WHATSAPP_MESSAGES.shipping}
            className="mt-6 inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 eyebrow text-[9px] tracking-[0.16em] hover:border-[color:var(--gold)]"
          >
            Ask about a delivery
          </WhatsAppLink>
        </div>
      </section>

      <section
        id="help"
        className="scroll-mt-[calc(var(--header-height)+4.5rem)] mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 md:px-8"
      >
        <div className="flex items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-foreground/10 sm:flex">
            <HelpCircle className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
          </span>
          <div>
            <p className="eyebrow mb-3 text-[color:var(--gold)]">Help</p>
            <h2 className="font-serif text-3xl italic sm:text-4xl">Questions, answered.</h2>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { Icon: Ruler, title: "Size guide", copy: "Charts live on every product page. Unsure? Send measurements on WhatsApp." },
            { Icon: Package, title: "Track an order", copy: "Sign in and open Orders, or share your order number with concierge." },
            { Icon: Shield, title: "Fabric & care", copy: "Dry-clean embroidery and silk. A care card is packed with every piece." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-foreground/10 bg-white p-5">
              <item.Icon className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
              <h3 className="mt-3 font-medium">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{item.copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-5 py-4 sm:px-6">
              <summary className="cursor-pointer list-none font-medium text-[15px] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-foreground/30 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/60">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 eyebrow text-[9px] tracking-[0.16em] hover:border-[color:var(--gold)]"
          >
            Track order
          </Link>
          <WhatsAppLink
            message={WHATSAPP_MESSAGES.chat}
            className="inline-flex h-10 items-center rounded-full bg-[color:var(--charcoal)] px-5 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--ivory)] hover:bg-[color:var(--maroon)]"
          >
            Chat with concierge
          </WhatsAppLink>
        </div>
      </section>
    </div>
  );
}
