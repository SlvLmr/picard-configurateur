import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ModelsShowcase } from "@/components/landing/ModelsShowcase";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      <Header />
      <Hero />
      <ModelsShowcase />
      <Footer />
    </main>
  );
}
