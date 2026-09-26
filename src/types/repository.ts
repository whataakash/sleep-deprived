export interface RepoFile {
  path: string;
  name: string;
  isDirectory: boolean;
  sizeBytes: number;
  extension?: string;
  children?: RepoFile[];
  content?: string;
  language?: string;
}

export interface SymbolDefinition {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'method';
  filePath: string;
  line: number;
  signature?: string;
  exported: boolean;
}

export interface WhyThisFile {
  filePath: string;
  relevanceScore: number; // 0 - 100
  reasons: string[];      // e.g. "Imported by auth.integration.test.ts", "Contains session token lifecycle", "Modified in recent commit"
  dependentFiles: string[];
  importedBy: string[];
  referencedByFailingTests: string[];
}

export interface FileDiffItem {
  filePath: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  hunks: {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: {
      type: 'add' | 'delete' | 'context';
      content: string;
      oldLineNo?: number;
      newLineNo?: number;
    }[];
  }[];
  changeReason: string;
  verifiedByTest: string;
}

export interface ContextSelectionStats {
  totalRepoFiles: number;
  inspectedFilesCount: number;
  selectedRelevantFilesCount: number;
  uncompressedTokens: number;
  compressedContextTokens: number;
  contextEfficiencyRatio: number; // e.g. 87%
  rankingFactors: {
    testErrorProximity: number;
    dependencyGraphDistance: number;
    symbolMatchStrength: number;
    recentChangeRecency: number;
  };
}

export interface RepositoryMetadata {
  id: string;
  name: string;
  owner: string;
  defaultBranch: string;
  branches: string[];
  description: string;
  framework: string;
  packageManager: string;
  totalFiles: number;
  totalTokens: number;
  lastVerifiedCommit: string;
}
