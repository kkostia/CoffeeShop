import { Navigation } from "@/components/site/navigation";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <About />
      </main>
    </>
  );
}
