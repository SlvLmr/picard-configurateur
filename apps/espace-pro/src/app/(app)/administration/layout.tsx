import { OngletsAdmin } from "@/components/administration/onglets-admin";

export default function LayoutAdministration({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OngletsAdmin />
      {children}
    </>
  );
}
