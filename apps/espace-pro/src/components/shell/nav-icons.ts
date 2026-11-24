import { ChartLine, Contact, FolderOpen, House, Inbox, Megaphone, Ruler, ShoppingBag, type LucideIcon } from "lucide-react";
import type { ModuleId } from "@/lib/roles";

export const NAV_ICONS: Record<ModuleId, LucideIcon> = {
  accueil: House,
  leads: Inbox,
  crm: Contact,
  pilotage: ChartLine,
  configurateur: Ruler,
  mediatheque: FolderOpen,
  marketing: Megaphone,
  boutique: ShoppingBag,
};
