import { CalendarDays, ChartLine, Contact, FolderOpen, House, Inbox, LifeBuoy, Megaphone, Newspaper, Ruler, ShoppingBag, UserCog, type LucideIcon } from "lucide-react";
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
  sav: LifeBuoy,
  news: Newspaper,
  calendrier: CalendarDays,
  administration: UserCog,
};
