export type MetricKey = string;

export type MetricValue = {
  key: MetricKey;
  value: number;
  sourceSection: string;
  sourceLabel: string;
  sourceColumn: string;
  rowIndex: number;
};

export type ParsedReport = {
  fileName: string;
  metrics: Map<MetricKey, MetricValue>;
};

export type RejectedReport = {
  fileName: string;
  reason: string;
};

export type MeanMetric = {
  key: MetricKey;
  section: string;
  label: string;
  column: string;
  mean: number;
  fileCount: number;
};
