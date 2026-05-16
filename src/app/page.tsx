import { Navigation } from "@/components/site/navigation";
import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { Menu } from "@/components/site/menu";
import { Beans } from "@/components/site/beans";
import { Visit } from "@/components/site/visit";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <About />
        <Menu />
        <Beans />
        <Visit />
      </main>
      <Footer />
    </>
  );
}
