import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type AnimatedBackgroundProps = {
  className?: string;
  interactive?: boolean;
};

function blobStyle(colorVar: string): CSSProperties {
  return {
    background: `radial-gradient(circle at center, rgba(var(${colorVar}), var(--animated-blob-alpha, 0.8)) 0, rgba(var(${colorVar}), 0) 50%)`,
  };
}

export function AnimatedBackground({ className, interactive = false }: AnimatedBackgroundProps) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      setPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [interactive]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--animated-base-opacity, 0.4)",
          background: "linear-gradient(135deg, var(--animated-bg-start), var(--animated-bg-end))",
        }}
      />

      <div className="animated-blobs absolute inset-0">
        <div
          className="animate-first absolute left-[10%] top-[5%] h-[32rem] w-[32rem] rounded-full blur-2xl"
          style={blobStyle("--animated-first-color")}
        />
        <div
          className="animate-second absolute right-[5%] top-[15%] h-[28rem] w-[28rem] rounded-full blur-2xl"
          style={blobStyle("--animated-second-color")}
        />
        <div
          className="animate-third absolute bottom-[10%] left-[20%] h-[30rem] w-[30rem] rounded-full blur-2xl"
          style={blobStyle("--animated-third-color")}
        />
        <div
          className="animate-fourth absolute bottom-[15%] right-[15%] h-[26rem] w-[26rem] rounded-full blur-2xl"
          style={blobStyle("--animated-fourth-color")}
        />
        <div
          className="animate-fifth absolute left-[40%] top-[40%] h-[24rem] w-[24rem] rounded-full blur-2xl"
          style={blobStyle("--animated-fifth-color")}
        />

        {interactive ? (
          <div
            className="absolute h-56 w-56 rounded-full blur-3xl transition-transform duration-300"
            style={{
              ...blobStyle("--animated-pointer-color"),
              left: pointer.x - 112,
              top: pointer.y - 112,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
