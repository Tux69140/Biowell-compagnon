import { parseCsv } from "./csvParser";
import type { MetricValue, ParsedReport } from "./metrics";

const KNOWN_SECTIONS = new Set([
  "Paramètres",
  "Champs d'énergie",
  "Mode de vie",
  "Centres nerveux",
  "Ennéagramme",
  "Yin Yang",
  "Organes et systèmes",
  "Les doigts et les secteurs",
]);

const ENTITY_HEADERS = new Set([
  "Nom",
  "Système",
  "Organe",
  "Doigt",
  "Secteur",
]);
const MINIMUM_METRICS = 10;

export function parseBiowellReport(
  fileName: string,
  text: string,
): ParsedReport {
  let rows: string[][];
  try {
    rows = parseCsv(text);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "lecture impossible",
    );
  }

  if (rows.length === 0)
    throw new Error("fichier vide ou structure CSV invalide");

  const metrics = new Map<string, MetricValue>();
  let currentSection = "";
  let currentHeaders: string[] = [];
  let currentSubsection = "";
  let currentGroup = "";

  rows.forEach((row, rowIndexZeroBased) => {
    const rowIndex = rowIndexZeroBased + 1;
    const cells = normalizeRow(row);
    const nonEmpty = cells.filter(Boolean);
    const numericIndexes = cells
      .map((cell, index) => (isNumericCell(cell) ? index : -1))
      .filter((index) => index >= 0);

    if (nonEmpty.length === 0) return;

    const section = nonEmpty.find((cell) => KNOWN_SECTIONS.has(cell));
    if (section && numericIndexes.length === 0 && nonEmpty.length <= 2) {
      currentSection = section;
      currentHeaders = [];
      currentSubsection = "";
      currentGroup = "";
      return;
    }

    if (!currentSection) return;

    if (numericIndexes.length === 0) {
      if (looksLikeHeader(cells)) {
        currentHeaders = cells;
        currentSubsection = "";
        currentGroup = "";
      } else if (currentSection === "Champs d'énergie") {
        currentSubsection = nonEmpty[0];
      }
      return;
    }

    ensureExpectedNumericColumnsAreNumeric(cells, currentHeaders, rowIndex);

    const rowGroup = cells[0] || currentGroup;
    if (cells[0]) currentGroup = cells[0];

    numericIndexes.forEach((columnIndex) => {
      const value = parseFrenchNumber(cells[columnIndex]);
      const sourceColumn = resolveSourceColumn(
        currentSection,
        currentHeaders,
        columnIndex,
      );
      const sourceLabel = resolveSourceLabel(currentSection, cells, rowGroup);
      const key = buildMetricKey({
        section: currentSection,
        subsection: currentSubsection,
        group: rowGroup,
        label: sourceLabel,
        sourceColumn,
      });

      if (metrics.has(key)) {
        throw new Error(
          `ambiguïté de clé impossible à résoudre ligne ${rowIndex} (${key})`,
        );
      }

      metrics.set(key, {
        key,
        value,
        sourceSection: currentSection,
        sourceLabel,
        sourceColumn,
        rowIndex,
      });
    });
  });

  if (metrics.size < MINIMUM_METRICS) {
    throw new Error(
      `pas assez de paramètres numériques exploitables (${metrics.size})`,
    );
  }

  return { fileName, metrics };
}

function normalizeRow(row: string[]): string[] {
  return row.map((cell) => cell.trim());
}

function looksLikeHeader(cells: string[]): boolean {
  const nonEmpty = cells.filter(Boolean);
  return (
    nonEmpty.length > 1 || nonEmpty.some((cell) => ENTITY_HEADERS.has(cell))
  );
}

function isNumericCell(cell: string): boolean {
  if (cell === "-") return true;
  return /^-?\d+(?:[,.]\d+)?$/.test(cell.trim());
}

export function parseFrenchNumber(cell: string): number {
  const normalized = cell.trim();
  if (normalized === "-") return 0;
  if (!isNumericCell(normalized))
    throw new Error(`valeur non numérique inattendue : ${cell}`);
  return Number(normalized.replace(",", "."));
}

function ensureExpectedNumericColumnsAreNumeric(
  cells: string[],
  headers: string[],
  rowIndex: number,
): void {
  headers.forEach((header, index) => {
    if (!header || ENTITY_HEADERS.has(header)) return;
    const value = cells[index];
    if (value && !isNumericCell(value)) {
      throw new Error(
        `valeur non numérique inattendue ligne ${rowIndex}, colonne ${header}`,
      );
    }
  });
}

function resolveSourceColumn(
  section: string,
  headers: string[],
  columnIndex: number,
): string {
  const header = headers[columnIndex];
  if (header && !ENTITY_HEADERS.has(header)) return header;
  if (section === "Paramètres" || section === "Champs d'énergie")
    return "Valeur";
  return `Colonne ${columnIndex + 1}`;
}

function resolveSourceLabel(
  section: string,
  cells: string[],
  group: string,
): string {
  if (section === "Organes et systèmes") return cells[1] || "Système";
  if (section === "Les doigts et les secteurs")
    return cells[1] || "Image entière";
  return cells[1] || cells[0] || group || "Mesure";
}

function buildMetricKey(input: {
  section: string;
  subsection: string;
  group: string;
  label: string;
  sourceColumn: string;
}): string {
  const { section, subsection, group, label, sourceColumn } = input;

  if (section === "Paramètres") return joinKey(section, label, "Valeur");
  if (section === "Champs d'énergie")
    return joinKey(section, subsection || group || label, label);
  if (section === "Organes et systèmes")
    return joinKey(section, group || label, label, sourceColumn);
  if (section === "Les doigts et les secteurs")
    return joinKey(section, sourceColumn, group || "Doigt non précisé", label);
  return joinKey(section, sourceColumn, label);
}

function joinKey(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}
