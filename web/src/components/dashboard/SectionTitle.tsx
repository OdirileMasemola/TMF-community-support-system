type SectionTitleProps = {
  title: string;
  description?: string;
};

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
      ) : null}
    </div>
  );
}
