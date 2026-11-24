import type { Metadata } from "next";
import { ModuleAVenir } from "@/components/module-a-venir";

export const metadata: Metadata = { title: "Médiathèque" };

export default function Page() {
  return <ModuleAVenir id="mediatheque" />;
}
