import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";
import Logo from "../components/ui/Logo";
import { useAuth, roleHomePath } from "../auth/AuthContext";

const STEPS = [
  {
    icon: "potted_plant",
    title: "Harvested",
    desc: "A farmer in Jumla registers a new batch the moment apples are picked — variety, weight, and farm location go on-chain instantly.",
  },
  {
    icon: "verified",
    title: "Certified",
    desc: "The local cooperative inspects and certifies the batch, locking in a quality guarantee that can never be quietly altered.",
  },
  {
    icon: "local_shipping",
    title: "In transit",
    desc: "Every checkpoint a transporter logs — Nepalgunj, Kohalpur, wherever — gets stamped onto the ledger as it happens.",
  },
  {
    icon: "store",
    title: "Delivered",
    desc: "The batch reaches its destination, completing a tamper-proof trail anyone can verify in seconds.",
  },
];

const FEATURES = [
  {
    icon: "hub",
    title: "Built on Ethereum",
    desc: "Every key event — harvest, certification, transit, delivery — is written to a smart contract, not just a database row.",
  },
  {
    icon: "qr_code_scanner",
    title: "Scan-to-trace",
    desc: "Consumers scan one QR code on the crate and see the apple's entire journey, no app install required.",
  },
  {
    icon: "science",
    title: "AI freshness check",
    desc: "Farmers snap a photo at harvest time and an AI model flags freshness before the batch even leaves the orchard.",
  },
  {
    icon: "groups",
    title: "Built for everyone in the chain",
    desc: "Dedicated, role-specific dashboards for farmers, cooperatives, transporters — and a zero-friction view for consumers.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const authLink = user ? (
    <Link
      to={roleHomePath(user.role)}
      onClick={() => setMenuOpen(false)}
      className="bg-primary text-on-primary font-bold text-sm rounded-2xl py-2.5 px-5 shadow-soft hover:bg-primary-container transition-all text-center"
    >
      Go to dashboard
    </Link>
  ) : (
    <Link
      to="/login"
      onClick={() => setMenuOpen(false)}
      className="bg-primary text-on-primary font-bold text-sm rounded-2xl py-2.5 px-5 shadow-soft hover:bg-primary-container transition-all text-center"
    >
      Sign in
    </Link>
  );

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#fcf9f3]/90 backdrop-blur-xl shadow-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Logo size={48} />
            <span className="font-headline text-xl font-bold text-primary">Jumla Trace</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              to="/blogs"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
            >
              Blog
            </Link>
            <Link
              to="/consumer/scan"
              className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
            >
              <Icon name="qr_code_scanner" size="18px" />
              Trace an apple
            </Link>
            <Link
              to="/donate"
              className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
            >
              <Icon name="volunteer_activism" size="18px" />
              Support us
            </Link>
            {authLink}
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-2xl" />
          </button>
        </div>

        {/* Mobile nav panel */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-1 px-6 pb-5 pt-1">
            <Link
              to="/blogs"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-surface-container-high"
            >
              Blog
            </Link>
            <Link
              to="/consumer/scan"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-surface-container-high"
            >
              <Icon name="qr_code_scanner" size="18px" />
              Trace an apple
            </Link>
            <Link
              to="/donate"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-2.5 rounded-xl hover:bg-surface-container-high"
            >
              <Icon name="volunteer_activism" size="18px" />
              Support us
            </Link>
            <div className="pt-2">{authLink}</div>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary-fixed opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container opacity-20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 bg-primary-fixed  text-black text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
            <Icon name="bolt" size="14px" />
            Built on Ethereum · Sepolia testnet
          </span>
          <h1 className="font-headline text-4xl sm:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
            Every Jumla apple
            <br />
            <span className="text-primary">tells its own story.</span>
          </h1>
          <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto">
            From the high-altitude orchards of Karnali to your kitchen table — scan one QR code and see a tamper-proof
            record of where your apple came from, who certified it, and how it got to you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/consumer/scan"
              className="flex items-center gap-2 bg-primary text-on-primary font-bold rounded-2xl py-4 px-7 shadow-soft hover:bg-primary-container active:scale-95 transition-all"
            >
              <Icon name="qr_code_scanner" />
              Trace an apple now
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 bg-surface-container-lowest text-on-surface font-bold rounded-2xl py-4 px-7 shadow-card hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <Icon name="person_add" />
              Join as farmer / partner
            </Link>
          </div>
        </div>
      </section>

      {/* Journey / how it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">How it works</span>
          <h2 className="font-headline text-3xl font-bold text-on-surface">One ledger, four checkpoints</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="bg-surface-container-lowest rounded-3xl p-6 shadow-card space-y-4 relative"
            >
              <span className="absolute top-4 right-5 text-3xl font-headline font-bold text-surface-container-high">
                0{i + 1}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center">
                <Icon name={step.icon} className="text-primary text-2xl" />
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">{step.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Why blockchain
            </span>
            <h2 className="font-headline text-3xl font-bold text-on-surface">
              Trust you can verify, not just promises
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 bg-surface-container-lowest rounded-3xl p-6 shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center shrink-0">
                  <Icon name={f.icon} className="text-tertiary text-2xl" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-headline text-lg font-bold text-on-surface">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto bg-primary rounded-[2.5rem] p-10 sm:p-14 text-on-primary relative overflow-hidden shadow-soft">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary-container rounded-full opacity-50 blur-2xl" />
          <div className="relative z-10 space-y-5">
            <h2 className="font-headline text-3xl font-bold">Ready to see the journey?</h2>
            <p className="text-primary-fixed/90">
              Scan a batch QR code, or join the network as a farmer, cooperative, or transporter.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/consumer/scan"
                className="flex items-center gap-2 bg-white text-primary font-bold rounded-2xl py-3.5 px-6 active:scale-95 transition-all"
              >
                <Icon name="qr_code_scanner" />
                Trace an apple
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-white/10 text-on-primary font-bold rounded-2xl py-3.5 px-6 border border-white/30 hover:bg-white/20 active:scale-95 transition-all"
              >
                <Icon name="arrow_forward" />
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-outline-variant/10 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Logo size={40} />
          <span className="font-headline text-lg font-bold text-primary">Jumla Trace</span>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
          From orchard to table — verified on blockchain
        </p>
      </footer>
    </div>
  );
}
