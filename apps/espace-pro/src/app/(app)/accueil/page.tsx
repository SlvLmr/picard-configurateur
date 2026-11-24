import type { Metadata } from "next";
import { AccueilParRole } from "./accueil-par-role";

export const metadata: Metadata = { title: "Accueil" };

export default function Page() {
  return <AccueilParRole />;
}
