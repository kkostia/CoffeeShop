import { Navigation } from "@/components/site/navigation";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { Menu } from "@/components/site/menu";
import { Beans } from "@/components/site/beans";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <About />
        <Menu />
        <Beans />
      </main>
    </>
  );
}
