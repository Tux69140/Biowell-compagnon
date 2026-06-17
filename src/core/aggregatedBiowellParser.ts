import type { ParsedReport, RejectedReport } from "./metrics";
import { isTimestampCell, parseBiowellReportFromRows } from "./biowellParser";

const SHARED_HEADER_LABELS = new Set([
  "Nom",
  "Système",
  "Organe",
  "Doigt",
  "Secteur",
]);

export type AggregatedParseResult = {
  reports: ParsedReport[];
  rejectedReports: RejectedReport[];
};

export function parseAggregatedBiowellReportFromRows(
  fileName: string,
  rows: string[][],
): AggregatedParseResult | null {
  if (rows.length < 3) return null;

  const timeColumns = rows[0]
    .map((cell, columnIndex) => ({
      cell,
      columnIndex,
    }))
    .filter(({ cell }) => isTimestampCell(cell))
    .map(({ cell, columnIndex }) => ({ timestamp: cell, columnIndex }));

  if (timeColumns.length < 3) return null;

  const patientLine = rows[1] ?? [];
  const baseName = fileName.replace(/\.csv$/i, "");
  const reports: ParsedReport[] = [];
  const rejectedReports: RejectedReport[] = [];

  for (const { timestamp, columnIndex } of timeColumns) {
    const patient = patientLine[columnIndex]?.trim();
    const displayName = patient
      ? `${patient} - ${timestamp}`
      : `${baseName} - ${timestamp}`;
    const normalizedRows = rows.map((row) =>
      normalizeAggregatedRow(row, columnIndex),
    );

    try {
      reports.push(
        parseBiowellReportFromRows(displayName, normalizedRows),
      );
    } catch (error) {
      rejectedReports.push({
        fileName: displayName,
        reason:
          error instanceof Error
            ? error.message
            : "rapport individuel dérivé non exploitable",
      });
    }
  }

  return { reports, rejectedReports };
}

function normalizeAggregatedRow(row: string[], columnIndex: number): string[] {
  const currentValue = row[columnIndex] ?? "";
  const sharedHeaderValue = row[2] ?? "";
  const value =
    currentValue || (isSharedHeaderRow(row) ? sharedHeaderValue : "");

  return [
    row[0] ?? "",
    row[1] ?? "",
    value,
  ];
}

function isSharedHeaderRow(row: string[]): boolean {
  return (
    SHARED_HEADER_LABELS.has((row[1] ?? "").trim()) &&
    (row[2] ?? "").trim() !== "" &&
    row.slice(3).every((cell) => (cell ?? "").trim() === "")
  );
}
