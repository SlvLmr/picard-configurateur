import type { Metadata } from "next";
import { ModuleAVenir } from "@/components/module-a-venir";

export const metadata: Metadata = { title: "Pilotage campagne" };

export default function Page() {
  return <ModuleAVenir id="campagnes" />;
}
