import { DoorOpen, Globe, Phone, Store } from "lucide-react";
import { Picto } from "@/components/ui/picto";

const ICONES = { "Ma Porte": DoorOpen, "Site web": Globe, Téléphone: Phone, Salon: Store } as const;

/** Picto de la source d'un lead. Ma Porte (configuré par le client) ressort en laiton. */
export function SourcePicto({ source }: { source: string }) {
  const Icon = ICONES[source as keyof typeof ICONES] ?? Globe;
  return <Picto icon={Icon} tone={source === "Ma Porte" ? "cta" : "neutral"} size="sm" />;
}
