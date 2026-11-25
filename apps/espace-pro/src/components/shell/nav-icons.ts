import { ClipboardList, MousePointerClick, Mail, Workflow, PartyPopper, ListChecks, ChartLine, Contact, FolderOpen, House, Inbox, LifeBuoy, Megaphone, Ruler, ShoppingBag, UserCog, type LucideIcon } from "lucide-react";
import type { ModuleId } from "@/lib/roles";

export const NAV_ICONS: Record<ModuleId, LucideIcon> = {
  accueil: House,
  leads: Inbox,
  crm: Contact,
  lead_management: Workflow,
  pilotage: ChartLine,
  configurateur: Ruler,
  mediatheque: FolderOpen,
  newsletters: Mail,
  questionnaires: ClipboardList,
  marketing: Megaphone,
  digital: MousePointerClick,
  animations: PartyPopper,
  boutique: ShoppingBag,
  sav: LifeBuoy,
  campagnes: ListChecks,
  administration: UserCog,
};
