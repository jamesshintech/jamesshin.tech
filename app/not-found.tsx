import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="reader">
      <Nav />
      <main id="main" className="not-found">
        <div className="g">
          <p className="mono">404</p>
          <h1 className="disp">Nothing here.</h1>
          <p className="line">
            The page may have moved when the site was rebuilt. <Link href="/">Go to the home page</Link> or{" "}
            <Link href="/writing">read the essays</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
