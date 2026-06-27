type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <h1 className="page-title">{title}</h1>
      <p className="page-description max-w-2xl">{description}</p>
    </section>
  );
}
