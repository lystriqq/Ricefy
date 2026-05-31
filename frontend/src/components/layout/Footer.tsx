import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} Ricefy — open-source</span>
      <nav className="flex items-center gap-4">
        <a
          href="https://ko-fi.com/lystriqq"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          ☕ Soutenir
        </a>
        <Link href="/legal/mentions" className="hover:text-foreground transition-colors">
          Mentions légales
        </Link>
        <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
          Politique de confidentialité
        </Link>
      </nav>
    </footer>
  );
}
