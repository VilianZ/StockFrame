export const DOMAIN_SCHEMA_VERSION = "m0.domain.1" as const;
export const MARKET_SNAPSHOT_VERSION = "m0.market-snapshot.1" as const;
export const METRIC_POLICY_VERSION = "m0.metric-policy.1" as const;
export const AI_PROMPT_VERSION = "m0.ai-prompt.1" as const;
export const REPORT_SCHEMA_VERSION = "m0.report.1" as const;

export const DOMAIN_VERSIONS = {
  domainSchema: DOMAIN_SCHEMA_VERSION,
  marketSnapshot: MARKET_SNAPSHOT_VERSION,
  metricPolicy: METRIC_POLICY_VERSION,
  aiPrompt: AI_PROMPT_VERSION,
  reportSchema: REPORT_SCHEMA_VERSION,
} as const;
