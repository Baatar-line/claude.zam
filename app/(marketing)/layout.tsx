import Link from "next/link";

import { Container } from "@/components/ui/Container";

const NAV = [
  { href: "/about", label: "Тухай" },
  { href: "/for-parents", label: "Эцэг эхэд" },
  { href: "/for-schools", label: "Сургуульд" },
] as const;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <Container className="flex h-16 max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-ink">
            Зам
          </Link>
          <nav className="flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-line-soft hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <Container className="max-w-5xl py-8 text-sm text-ink-faint">
          © {new Date().getFullYear()} Зам. Монгол сурагчдад зориулсан, үнэ төлбөргүй.
        </Container>
      </footer>
    </div>
  );
}
