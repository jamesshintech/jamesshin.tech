import Image from "next/image";
import type { Frame as FrameData } from "@/data/projects";

// Every visual on the home page is a real frame of the product: an App
// Store listing image or a capture of the live site. The Yonmoku chapter
// adds the real board model behind a click (BoardViewer.tsx).

export function Frame({ frame, phone = true }: { frame: FrameData; phone?: boolean }) {
  return (
    <Image
      src={frame.src}
      width={frame.width}
      height={frame.height}
      alt={frame.alt}
      unoptimized
      className={phone ? "frame phone" : "frame"}
      sizes={phone ? "280px" : "(max-width: 860px) 100vw, 620px"}
    />
  );
}
