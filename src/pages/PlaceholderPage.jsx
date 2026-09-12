export default function PlaceholderPage({ title }) {
  return (
    <div>
      {title ? (
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">{title}</h1>
      ) : null}
      <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-sm min-h-[320px] p-6 flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">This section is coming soon.</p>
      </div>
    </div>
  );
}
