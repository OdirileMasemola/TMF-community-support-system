import { Camera, Globe2, MessageCircleMore, Share2 } from "lucide-react";

const socialLinks = [
  {
    name: "Instagram",
    href: "#instagram-placeholder",
    icon: Camera,
    accentClass: "hover:border-[#E1306C] hover:bg-[#E1306C]/10 hover:text-[#E1306C]",
    glowClass: "hover:shadow-[0_0_24px_rgba(225,48,108,0.24)]",
  },
  {
    name: "Discord",
    href: "#discord-placeholder",
    icon: MessageCircleMore,
    accentClass: "hover:border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-[#5865F2]",
    glowClass: "hover:shadow-[0_0_24px_rgba(88,101,242,0.24)]",
  },
  {
    name: "GitHub",
    href: "#github-placeholder",
    icon: Globe2,
    accentClass: "hover:border-[#333333] hover:bg-[#333333]/10 hover:text-[#333333]",
    glowClass: "hover:shadow-[0_0_24px_rgba(51,51,51,0.2)]",
  },
  {
    name: "LinkedIn",
    href: "#linkedin-placeholder",
    icon: Share2,
    accentClass: "hover:border-[#0A66C2] hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    glowClass: "hover:shadow-[0_0_24px_rgba(10,102,194,0.24)]",
  },
];

export function ConnectWithUs() {
  return (
    <section id="connect-with-us" className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-card/70">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Connect With Us</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Follow our journey and stay close to the work
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Use these channels to keep up with updates, community stories, and opportunities to get involved.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {socialLinks.map(({ name, href, icon: Icon, accentClass, glowClass }) => (
            <a
              key={name}
              href={href}
              className={`group flex items-center gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${accentClass} ${glowClass}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-foreground transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-base font-semibold text-foreground">{name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ConnectWithUs;
