// ---- Types for release-metadata.ts ----

export interface CheckReleaseResult {
  errors: string[];
  target: string | null;
  needsBump: boolean;
}

export interface CheckReleaseInput {
  changelog: string;
  changelogChanged: boolean;
  baseVersion: string;
  versions: (string | undefined)[];
}
