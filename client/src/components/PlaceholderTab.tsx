type PlaceholderTabProps = {
  title: string;
  description: string;
};

export const PlaceholderTab = ({ title, description }: PlaceholderTabProps) => (
  <section className="panel">
    <p className="eyebrow">Authenticated Area</p>
    <h2>{title}</h2>
    <p className="muted">{description}</p>
  </section>
);
