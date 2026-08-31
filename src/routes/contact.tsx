import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
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
import { WHATSAPP_DISPLAY, WHATSAPP_MESSAGES, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact, Returns & Shipping — Blessings" },
      {
        name: "description",
        content:
          "Visit the Blessings Delhi atelier, book a virtual fitting, or read returns, shipping and help. Concierge on WhatsApp.",
      },
      { property: "og:title", content: "Contact — Blessings" },
      { property: "og:description", content: "Delhi flagship, returns, worldwide shipping, and atelier help." },
    ],
  }),
  component: Contact,
});

const JUMP_LINKS = [
  { id: "contact", label: "Contact" },
  { id: "atelier", label: "Atelier" },
  { id: "returns", label: "Returns" },
  { id: "shipping", label: "Shipping" },
  { id: "help", label: "Help" },
] as const;

const TOPICS = ["Bespoke consultation", "An order", "Returns & exchange", "Shipping", "Sizing", "Other"] as const;

const FAQS = [
  {
    q: "How long does a ready piece take to ship?",
    a: "Ready pieces leave the Delhi atelier within 3–5 working days. International express typically arrives in 4–8 days after dispatch, depending on customs.",
  },
  {
    q: "Do you offer made-to-measure?",
    a: "Yes. Book a private consultation in Delhi or a virtual fitting on WhatsApp or Zoom. Bespoke pieces are patterned on your block and finished over about 30 days.",
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
    window.open(whatsappUrl(body), "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp with your message.");
  };

  return (
    <div className="bg-[color:var(--ivory)]">
      <section className="border-b border-foreground/10">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20 md:px-8 md:py-24">
          <p className="eyebrow mb-4 text-[color:var(--gold)]">The Concierge</p>
          <h1 className="font-serif max-w-3xl text-balance text-3xl italic leading-tight sm:text-5xl md:text-6xl">
            We’re here — in Delhi, and wherever you are.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-foreground/65 sm:text-base">
            Visit the flagship, book a virtual fitting, or write to the house about an order, a return, or a wedding
            brief. Returns, shipping and help live on this page.
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
                    {WHATSAPP_DISPLAY}
                  </WhatsAppLink>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <Mail className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">Email</p>
                  <a href="mailto:hello@blessings.house" className="mt-1 block text-sm hover:text-[color:var(--maroon)]">
                    hello@blessings.house
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10">
                  <Clock className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="eyebrow text-[9px]">Hours</p>
                  <p className="mt-1 text-sm text-foreground/70">Monday — Saturday, 11am to 8pm IST</p>
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
            <p className="eyebrow mb-3 text-[color:var(--gold)]">Flagship</p>
            <h2 className="font-serif text-3xl italic sm:text-4xl">Visit the Delhi atelier.</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/65">
              Private viewings by walk-in or appointment. Bring a reference, a date, or simply come to feel the silks.
              Virtual fittings are available for the UK, USA, UAE, Canada and beyond.
            </p>
            <div className="mt-8 flex gap-4">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[color:var(--gold)]" strokeWidth={1.5} />
              <p className="text-sm leading-relaxed text-foreground/75">
                21, South Extension II
                <br />
                New Delhi 110049, India
              </p>
            </div>
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
              ["Press & events", "For editorials and trunk shows, write to hello@blessings.house with dates and city."],
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
        id="returns"
        className="scroll-mt-[calc(var(--header-height)+4.5rem)] mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 md:px-8"
      >
        <div className="flex items-start gap-4">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-foreground/10 sm:flex">
            <RotateCcw className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
          </span>
          <div className="max-w-3xl">
            <p className="eyebrow mb-3 text-[color:var(--gold)]">Returns</p>
            <h2 className="font-serif text-3xl italic sm:text-4xl">Seven days, unworn, with tags.</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/65">
              Ready-to-wear pieces may be returned within 7 days of delivery if they are unworn, unwashed, and still
              carry original tags and packaging. Refunds go back to the original payment method once the atelier
              receives and inspects the garment.
            </p>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["01", "Write to us", "Open a return from this page or WhatsApp with your order number and reason."],
            ["02", "Ship it back", "We share a prepaid label for India. International returns ship at the client’s cost unless the piece is defective."],
            ["03", "Refund or exchange", "Once inspected in Delhi, we refund or exchange. Store credit is available if you prefer another silhouette."],
          ].map(([n, title, copy]) => (
            <div key={n} className="rounded-2xl border border-foreground/10 bg-white p-6">
              <p className="font-serif text-2xl italic text-[color:var(--gold)]">{n}</p>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{copy}</p>
            </div>
          ))}
        </div>
        <ul className="mt-8 space-y-2 text-sm text-foreground/65">
          <li>Bespoke and made-to-measure garments are not returnable unless there is a manufacturing fault.</li>
          <li>Sale pieces are final unless damaged in transit — photograph the parcel before opening.</li>
          <li>Earrings of perfume, makeup or deodorant on a garment cannot be accepted.</li>
        </ul>
        <WhatsAppLink
          message={WHATSAPP_MESSAGES.returns}
          className="mt-8 inline-flex h-10 items-center rounded-full border border-foreground/15 px-5 eyebrow text-[9px] tracking-[0.16em] hover:border-[color:var(--gold)]"
        >
          Start a return on WhatsApp
        </WhatsAppLink>
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
              <h2 className="font-serif text-3xl italic sm:text-4xl">From Delhi to your door.</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                Complimentary worldwide shipping on every Blessings order. Duties and taxes for your country are shown
                at checkout where we can calculate them; otherwise they may be collected by local customs.
              </p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Package, title: "Ready to wear", copy: "Leaves Delhi in 3–5 working days after confirmation." },
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
