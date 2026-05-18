import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "../core/csvParser";
import { parseBiowellReport, parseFrenchNumber } from "../core/biowellParser";
import { analyzeReports } from "../core/representativity";
import { exportMeansCsv } from "../core/exportMeansCsv";

const root = process.cwd();
const exampleFiles = [
  "2026-01-16 11_40 - Stephane MIC.csv",
  "2026-01-16 11_48 - Stephane MIC.csv",
  "2026-01-16 11_51 - Stephane MIC.csv",
];

describe("parsing CSV", () => {
  it("supporte les guillemets, les points-virgules et les lignes", () => {
    expect(parseCsv('"Nom";"Valeur"\n"A;B";"3,05"')).toEqual([
      ["Nom", "Valeur"],
      ["A;B", "3,05"],
    ]);
  });

  it("convertit les nombres français et les tirets", () => {
    expect(parseFrenchNumber("3,05")).toBe(3.05);
    expect(parseFrenchNumber("68182")).toBe(68182);
    expect(parseFrenchNumber("-")).toBe(0);
  });
});

describe("parser Bio-Well", () => {
  it("extrait des clés contextualisées des rapports exemples", () => {
    const text = readFileSync(
      join(root, "rapports_exemple", exampleFiles[0]),
      "utf8",
    );
    const report = parseBiowellReport(exampleFiles[0], text);

    expect(report.metrics.size).toBeGreaterThan(1_000);
    expect(report.metrics.get("Paramètres/Stress/Valeur")?.value).toBe(3.05);
    expect(report.metrics.get("Champs d'énergie/Gauche/Zone")?.value).toBe(
      68182,
    );
    expect(
      report.metrics.get(
        "Les doigts et les secteurs/Zone/Pouce gauche/Image entière",
      )?.value,
    ).toBe(9864);
  });
});

describe("représentativité", () => {
  it("analyse les 3 rapports exemples et exporte les moyennes", () => {
    const inputs = exampleFiles.map((fileName) => ({
      fileName,
      text: readFileSync(join(root, "rapports_exemple", fileName), "utf8"),
    }));

    const result = analyzeReports(inputs);

    expect(result.validReports).toHaveLength(3);
    expect(result.rejectedReports).toHaveLength(0);
    expect(result.commonMetricCount).toBeGreaterThan(1_000);
    expect(result.winners.length).toBeGreaterThanOrEqual(1);
    expect(result.explanation).toContain("plus représentatif");

    const csv = exportMeansCsv(result.means);
    expect(csv.split("\n")[0]).toBe(
      "cle;section;libelle;colonne;moyenne;nombre_fichiers",
    );
    expect(csv).toContain("Paramètres/Stress/Valeur;Paramètres;Stress;Valeur;");
  });

  it("conserve les égalités de score", () => {
    const text = [
      '"";"Paramètres";"";""',
      '"";"Stress";"1";""',
      '"";"Énergie";"2";""',
      '"";"CE";"-";""',
      '"";"Champs d\'énergie";"";""',
      '"";"Gauche";"";""',
      '"";"Zone";"10";""',
      '"";"Énergie";"3";""',
      '"";"Mode de vie";"";""',
      '"";"Nom";"%";""',
      '"";"Activité physique";"4";""',
      '"";"Nutrition";"5";""',
      '"";"Environnement";"6";""',
      '"";"Psychologie";"7";""',
      '"";"Régime du jour";"8";""',
      '"";"Activité hormonale";"9";""',
    ].join("\n");

    const result = analyzeReports([
      { fileName: "a.csv", text },
      { fileName: "b.csv", text },
      { fileName: "c.csv", text },
    ]);

    expect(result.winners.map((winner) => winner.fileName)).toEqual([
      "a.csv",
      "b.csv",
      "c.csv",
    ]);
  });
});
