export interface CombineLatestExecutorSchema {
  targets: Array<string | { target: string; overrides: any }>;
}
