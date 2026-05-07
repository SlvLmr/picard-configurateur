import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DoorPreview } from "@/components/configurator/DoorPreview";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { ViewToggle } from "@/components/configurator/ViewToggle";

export default function ConfiguratorPage() {
  return (
    <main className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 h-16 px-6 flex items-center justify-between border-b border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="font-display text-base">
          Picard <span className="text-accent">Serrures</span>
        </div>
        <div className="w-20" />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Preview */}
        <div className="flex-1 relative p-6 lg:p-10 min-h-[55vh] lg:min-h-0">
          <DoorPreview />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <ViewToggle />
          </div>
        </div>

        {/* Panel */}
        <aside className="w-full lg:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background">
          <ConfiguratorPanel />
        </aside>
      </div>
    </main>
  );
}
