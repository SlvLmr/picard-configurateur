export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6 bg-background">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="font-display text-foreground">
          Picard <span className="text-accent">Serrures</span>
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-foreground transition-colors">
            Mentions légales
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Confidentialité
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
        <div className="text-xs">
          © {new Date().getFullYear()} Picard Serrures · Fabriqué en France
        </div>
      </div>
    </footer>
  );
}
