import { AppShell } from "@/components/shell/app-shell";
import { profilCourant } from "@/lib/data/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profil = await profilCourant();
  return <AppShell profil={profil}>{children}</AppShell>;
}
