import { useMemo, useState } from "react";
import {
  analyzeReports,
  type RepresentativityResult,
} from "../core/representativity";
import { exportMeansCsv } from "../core/exportMeansCsv";

type LoadedFile = {
  name: string;
  text: string;
};

type AnalysisError = {
  message: string;
  rejectedReports?: { fileName: string; reason: string }[];
  validCount?: number;
};

export function App() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RepresentativityResult | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);

  const canAnalyze = files.length >= 3 && !isAnalyzing;
  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  async function loadFiles(fileList: FileList | File[]) {
    const csvFiles = [...fileList].filter((file) =>
      file.name.toLowerCase().endsWith(".csv"),
    );
    const loadedFiles = await Promise.all(
      csvFiles.map(async (file) => ({
        name: file.name,
        text: await readTextFile(file),
      })),
    );

    setFiles((current) => mergeFilesByName(current, loadedFiles));
    setResult(null);
    setError(null);
  }

  function analyze() {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    window.setTimeout(() => {
      try {
        setResult(
          analyzeReports(
            files.map((file) => ({ fileName: file.name, text: file.text })),
          ),
        );
      } catch (analysisError) {
        setError({
          message:
            analysisError instanceof Error
              ? analysisError.message
              : "Analyse impossible.",
          rejectedReports: getErrorProperty(analysisError, "rejectedReports"),
          validCount: getErrorProperty(analysisError, "validCount"),
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 0);
  }

  function exportCsv() {
    if (!result) return;
    const blob = new Blob([exportMeansCsv(result.means)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "moyennes-biowell.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFiles([]);
    setResult(null);
    setError(null);
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Prototype local sans stockage</p>
          <h1>Sélection du rapport Bio-Well le plus représentatif</h1>
          <p className="intro">
            Importez au moins 3 rapports CSV Bio-Well d&apos;une même personne.
            L&apos;application calcule la moyenne de chaque paramètre commun aux
            rapports, puis sélectionne le rapport dont les valeurs sont
            globalement les plus proches de ces moyennes.
          </p>
        </div>
        <div className="warning" role="note">
          Cette application fournit une aide statistique à la comparaison de
          rapports Bio-Well. Elle ne constitue pas un dispositif médical et ne
          produit aucun diagnostic.
        </div>
      </section>

      <section className="workspace-card">
        <label
          className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void loadFiles(event.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(event) =>
              event.currentTarget.files &&
              void loadFiles(event.currentTarget.files)
            }
          />
          <span className="drop-title">Glissez-déposez vos rapports CSV</span>
          <span className="drop-subtitle">
            ou cliquez pour sélectionner au moins 3 fichiers.
          </span>
        </label>

        <div className="actions">
          <button type="button" onClick={analyze} disabled={!canAnalyze}>
            {isAnalyzing ? "Analyse en cours…" : "Analyser"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={reset}
            disabled={files.length === 0 && !result && !error}
          >
            Réinitialiser
          </button>
          {result && (
            <button type="button" className="secondary" onClick={exportCsv}>
              Exporter les moyennes CSV
            </button>
          )}
        </div>

        <FileStatus files={fileNames} />
      </section>

      <ResultPanel result={result} error={error} isAnalyzing={isAnalyzing} />
    </main>
  );
}

function FileStatus({ files }: { files: string[] }) {
  if (files.length === 0)
    return <p className="status muted">Aucun fichier importé.</p>;
  return (
    <div className="status">
      <strong>
        {files.length} fichier{files.length > 1 ? "s" : ""} importé
        {files.length > 1 ? "s" : ""}
      </strong>
      {files.length < 3 && (
        <span className="hint">
          Ajoutez encore {3 - files.length} fichier
          {3 - files.length > 1 ? "s" : ""} pour lancer l&apos;analyse.
        </span>
      )}
      <ul className="file-list">
        {files.map((fileName) => (
          <li key={fileName}>{fileName}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultPanel({
  result,
  error,
  isAnalyzing,
}: {
  result: RepresentativityResult | null;
  error: AnalysisError | null;
  isAnalyzing: boolean;
}) {
  if (isAnalyzing)
    return (
      <section className="result-card">
        <p>Analyse en cours…</p>
      </section>
    );

  if (error) {
    return (
      <section className="result-card error-card">
        <h2>Analyse impossible</h2>
        <p>{error.message}</p>
        {typeof error.validCount === "number" && (
          <p>{error.validCount} fichier(s) exploitable(s) détecté(s).</p>
        )}
        <RejectedList rejectedReports={error.rejectedReports ?? []} />
      </section>
    );
  }

  if (!result)
    return (
      <section className="result-card">
        <p className="muted">Le résultat apparaîtra ici après analyse.</p>
      </section>
    );

  return (
    <section className="result-card success-card">
      <p className="eyebrow">Rapport le plus représentatif</p>
      <h2>{result.winners.map((winner) => winner.fileName).join(" · ")}</h2>
      <p>{result.explanation}</p>
      <div className="metrics-grid">
        <div>
          <span>{result.validReports.length}</span>
          <small>fichiers analysés</small>
        </div>
        <div>
          <span>{result.commonMetricCount.toLocaleString("fr-FR")}</span>
          <small>paramètres communs</small>
        </div>
        <div>
          <span>{formatScore(result.winners[0].score)}</span>
          <small>meilleur écart moyen</small>
        </div>
      </div>
      {result.distantReports.length > 0 && (
        <div className="notice">
          <strong>
            Rapport(s) très éloigné(s) signalé(s), sans exclusion automatique :
          </strong>
          <ul>
            {result.distantReports.map((report) => (
              <li key={report.fileName}>
                {report.fileName} — score {formatScore(report.score)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <RejectedList rejectedReports={result.rejectedReports} />
    </section>
  );
}

function RejectedList({
  rejectedReports,
}: {
  rejectedReports: { fileName: string; reason: string }[];
}) {
  if (rejectedReports.length === 0) return null;
  return (
    <div className="notice rejected">
      <strong>Fichiers ignorés :</strong>
      <ul>
        {rejectedReports.map((report) => (
          <li key={report.fileName}>
            {report.fileName} : {report.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

async function readTextFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function mergeFilesByName(
  current: LoadedFile[],
  next: LoadedFile[],
): LoadedFile[] {
  const merged = new Map(current.map((file) => [file.name, file]));
  next.forEach((file) => merged.set(file.name, file));
  return [...merged.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

function getErrorProperty<T extends "rejectedReports" | "validCount">(
  error: unknown,
  key: T,
): AnalysisError[T] | undefined {
  if (typeof error === "object" && error !== null && key in error) {
    return (error as AnalysisError)[key];
  }
  return undefined;
}

function formatScore(score: number): string {
  return score.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
}
