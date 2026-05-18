import type { MeanMetric } from "./metrics";

export function exportMeansCsv(means: MeanMetric[]): string {
  const header = [
    "cle",
    "section",
    "libelle",
    "colonne",
    "moyenne",
    "nombre_fichiers",
  ];
  const rows = means.map((mean) => [
    mean.key,
    mean.section,
    mean.label,
    mean.column,
    formatFrenchNumber(mean.mean),
    String(mean.fileCount),
  ]);
  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\n");
}

function formatFrenchNumber(value: number): string {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 10,
    useGrouping: false,
  });
}

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
