import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-foreground"
        >
          Picard <span className="text-accent">Serrures</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          <Link href="#modeles" className="hover:text-foreground transition-colors">
            Modèles
          </Link>
          <Link href="#savoir-faire" className="hover:text-foreground transition-colors">
            Savoir-faire
          </Link>
          <Link href="#installateurs" className="hover:text-foreground transition-colors">
            Installateurs
          </Link>
        </nav>
        <Link
          href="/configurateur"
          className="text-sm font-medium text-foreground hover:text-accent transition-colors"
        >
          Configurer →
        </Link>
      </div>
    </header>
  );
}
