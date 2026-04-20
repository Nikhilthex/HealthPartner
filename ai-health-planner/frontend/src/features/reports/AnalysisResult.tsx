import type { ReportAnalysis } from './types';

type AnalysisResultProps = {
  analysis: ReportAnalysis;
};

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  return (
    <article className="analysis-result">
      <section className="result-band">
        <p className="eyebrow">Report Summary</p>
        <p>{analysis.summaryLayman}</p>
      </section>

      <ResultList title="Risks" items={analysis.risks} />
      <ResultList title="Medicine Suggestions" items={analysis.medicineSuggestions} />
      <ResultList title="Vitamin Suggestions" items={analysis.vitaminSuggestions} />
      <ResultList title="Important Notes" items={analysis.importantNotes} />

      <footer className="disclaimer">
        <strong>Medical disclaimer:</strong> {analysis.disclaimer}
      </footer>
    </article>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="result-card">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No items returned for this section.</p>
      )}
    </section>
  );
}
