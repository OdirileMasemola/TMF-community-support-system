type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  inverted?: boolean;
};

export function SectionHeader({ title, subtitle, align = "left", inverted = false }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto text-center" : "text-left"}>
      <h2
        className={`text-2xl font-bold md:text-3xl ${inverted ? "text-footer-foreground" : "text-foreground"}`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-2 max-w-2xl ${inverted ? "text-footer-foreground/80" : "text-muted-foreground"} ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
