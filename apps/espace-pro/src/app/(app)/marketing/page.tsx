import type { Metadata } from "next";
import { Marketing } from "@/components/marketing/marketing";

export const metadata: Metadata = { title: "Marketing" };

export default function Page() {
  return <Marketing />;
}
