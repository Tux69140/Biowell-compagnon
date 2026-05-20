import type {
  MeanMetric,
  MetricKey,
  ParsedReport,
  RejectedReport,
} from "./metrics";
import { parseBiowellReport } from "./biowellParser";

export type ReportInput = {
  fileName: string;
  text: string;
};

export type ReportScore = {
  fileName: string;
  score: number;
};

export type RepresentativityResult = {
  validReports: ParsedReport[];
  rejectedReports: RejectedReport[];
  commonMetricCount: number;
  means: MeanMetric[];
  scores: ReportScore[];
  winners: ReportScore[];
  distantReports: ReportScore[];
  explanation: string;
};

const TIE_TOLERANCE = 1e-9;

export function analyzeReports(inputs: ReportInput[]): RepresentativityResult {
  const validReports: ParsedReport[] = [];
  const rejectedReports: RejectedReport[] = [];

  inputs.forEach((input) => {
    try {
      validReports.push(parseBiowellReport(input.fileName, input.text));
    } catch (error) {
      rejectedReports.push({
        fileName: input.fileName,
        reason:
          error instanceof Error ? error.message : "fichier non exploitable",
      });
    }
  });

  if (validReports.length < 3) {
    throw Object.assign(
      new Error(
        "Analyse impossible : au moins 3 fichiers CSV Bio-Well exploitables sont nécessaires.",
      ),
      {
        rejectedReports,
        validCount: validReports.length,
      },
    );
  }

  const commonKeys = intersectMetricKeys(validReports);
  if (commonKeys.length === 0) {
    throw Object.assign(
      new Error(
        "Analyse impossible : aucun paramètre numérique commun aux fichiers exploitables.",
      ),
      {
        rejectedReports,
        validCount: validReports.length,
      },
    );
  }

  const means = computeMeans(validReports, commonKeys);
  const meanByKey = new Map(means.map((mean) => [mean.key, mean.mean]));
  const scores = validReports
    .map((report) => ({
      fileName: report.fileName,
      score: average(
        commonKeys.map((key) =>
          Math.abs(report.metrics.get(key)!.value - meanByKey.get(key)!),
        ),
      ),
    }))
    .sort(
      (a, b) => a.score - b.score || a.fileName.localeCompare(b.fileName, "fr"),
    );

  const bestScore = scores[0].score;
  const winners = scores.filter(
    (score) => Math.abs(score.score - bestScore) <= TIE_TOLERANCE,
  );
  const median = medianOf(scores.map((score) => score.score));
  const distantReports = scores.filter(
    (score) => median > 0 && score.score > 2 * median,
  );

  return {
    validReports,
    rejectedReports,
    commonMetricCount: commonKeys.length,
    means,
    scores,
    winners,
    distantReports,
    explanation: buildExplanation(
      winners,
      validReports.length,
      commonKeys.length,
    ),
  };
}

function intersectMetricKeys(reports: ParsedReport[]): MetricKey[] {
  const [first, ...others] = reports;
  return [...first.metrics.keys()]
    .filter((key) => others.every((report) => report.metrics.has(key)))
    .sort((a, b) => a.localeCompare(b, "fr"));
}

function computeMeans(
  reports: ParsedReport[],
  keys: MetricKey[],
): MeanMetric[] {
  return keys.map((key) => {
    const firstMetric = reports[0].metrics.get(key)!;
    return {
      key,
      section: firstMetric.sourceSection,
      label: firstMetric.sourceLabel,
      column: firstMetric.sourceColumn,
      mean: average(reports.map((report) => report.metrics.get(key)!.value)),
      fileCount: reports.length,
    };
  });
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function buildExplanation(
  winners: ReportScore[],
  fileCount: number,
  commonMetricCount: number,
): string {
  const names = winners.map((winner) => `« ${winner.fileName} »`).join(", ");
  if (winners.length > 1) {
    return `${winners.length} fichiers sont aussi représentatifs selon le score calculé : ${names}. Les moyennes ont été calculées paramètre par paramètre sur ${commonMetricCount.toLocaleString("fr-FR")} paramètres communs issus de ${fileCount} fichiers exploitables.`;
  }
  return `Le fichier ${names} est le plus représentatif, car son écart moyen aux moyennes calculées est le plus faible parmi les ${fileCount} fichiers analysés. Les moyennes ont été calculées paramètre par paramètre sur ${commonMetricCount.toLocaleString("fr-FR")} paramètres communs.`;
}
