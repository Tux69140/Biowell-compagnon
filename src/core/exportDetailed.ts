import type { MeanMetric, ParsedReport } from "./metrics";

export type DetailedRow = {
  key: string;
  section: string;
  label: string;
  column: string;
  valuesByFile: Record<string, number>;
  mean: number;
  closestFile: string;
};

export function buildDetailedRows(
  means: MeanMetric[],
  reports: ParsedReport[],
): DetailedRow[] {
  const fileNames = reports.map((report) => report.fileName);

  return means.map((mean) => {
    const valuesByFile: Record<string, number> = {};
    let closestFile = fileNames[0];
    let closestDelta = Number.POSITIVE_INFINITY;

    reports.forEach((report) => {
      const value = report.metrics.get(mean.key)!.value;
      valuesByFile[report.fileName] = value;
      const delta = Math.abs(value - mean.mean);
      if (delta < closestDelta) {
        closestDelta = delta;
        closestFile = report.fileName;
      }
    });

    return {
      key: mean.key,
      section: mean.section,
      label: mean.label,
      column: mean.column,
      valuesByFile,
      mean: mean.mean,
      closestFile,
    };
  });
}

export function exportDetailedCsv(
  rows: DetailedRow[],
  fileNames: string[],
): string {
  const header = [
    "cle",
    "section",
    "libelle",
    "colonne",
    ...fileNames,
    "moyenne_calculee",
    "fichier_plus_proche_de_la_moyenne",
  ];

  const lines = rows.map((row) => [
    row.key,
    row.section,
    row.label,
    row.column,
    ...fileNames.map((name) => formatFrenchNumber(row.valuesByFile[name])),
    formatFrenchNumber(row.mean),
    row.closestFile,
  ]);

  return [header, ...lines]
    .map((line) => line.map(escapeCsvCell).join(";"))
    .join("\n");
}

export function exportDetailedXls(
  rows: DetailedRow[],
  fileNames: string[],
): string {
  const columns = [
    "cle",
    "section",
    "libelle",
    "colonne",
    ...fileNames,
    "moyenne_calculee",
    "fichier_plus_proche_de_la_moyenne",
  ];

  const xmlRows = [
    `<Row>${columns.map((name) => textCell(name, "sHeader")).join("")}</Row>`,
    ...rows.map((row) => {
      const meanCell = numberCell(row.mean);
      const fileCells = fileNames
        .map((name) => {
          const style = name === row.closestFile ? "sClosest" : undefined;
          return numberCell(row.valuesByFile[name], style);
        })
        .join("");

      return `<Row>${textCell(row.key)}${textCell(row.section)}${textCell(row.label)}${textCell(row.column)}${fileCells}${meanCell}${textCell(row.closestFile)}</Row>`;
    }),
  ].join("\n");

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="sHeader"><Font ss:Bold="1"/><Interior ss:Color="#DDEBF7" ss:Pattern="Solid"/></Style>
    <Style ss:ID="sClosest"><Interior ss:Color="#C6EFCE" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="Comparaison">
    <Table>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;
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

function textCell(value: string, styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function numberCell(value: number, styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}><Data ss:Type="Number">${Number(value.toFixed(10))}</Data></Cell>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
