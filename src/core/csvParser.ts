export function parseCsv(text: string, separator = ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === separator) {
      row.push(cleanCell(cell));
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cleanCell(cell));
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (inQuotes) throw new Error("structure CSV invalide : guillemet non fermé");
  if (cell.length > 0 || row.length > 0) {
    row.push(cleanCell(cell));
    rows.push(row);
  }

  return rows.filter((parsedRow) => parsedRow.some((value) => value !== ""));
}

function cleanCell(value: string): string {
  return value.trim().replace(/^"|"$/g, "").trim();
}
