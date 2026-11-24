import type { Metadata } from "next";
import { LeadsParRole } from "./leads-par-role";

export const metadata: Metadata = { title: "Leads" };

export default function Page() {
  return <LeadsParRole />;
}
