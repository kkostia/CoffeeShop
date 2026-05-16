import { Navigation } from "@/components/site/navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <main id="top" className="pt-20">
        <section className="grid min-h-[80vh] place-items-center px-6">
          <div className="text-center">
            <p className="font-display text-5xl tracking-tight text-primary">
              Bramble &amp; Brew
            </p>
            <p className="mt-3 text-muted-foreground">
              Sections coming next — hero on the way.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
