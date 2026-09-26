import { ContextSelectionStats, WhyThisFile } from '@/types/repository';
import { MOCK_WHY_THIS_FILE } from './mock-repo';

export class ContextEngine {
  public static calculateContext(taskQuery: string): {
    stats: ContextSelectionStats;
    relevantFiles: string[];
    fileExplanations: Record<string, WhyThisFile>;
  } {
    const isAuthTask = taskQuery.toLowerCase().includes('auth') || taskQuery.toLowerCase().includes('token');

    const relevantFiles = isAuthTask
      ? [
          'src/auth/client.ts',
          'src/auth/session.ts',
          'src/auth/middleware.ts',
          'tests/integration/auth.test.ts',
        ]
      : ['src/server/routes.ts', 'src/auth/session.ts'];

    const totalRepoTokens = 184500;
    const selectedTokens = 42800;
    const efficiency = Math.round(((totalRepoTokens - selectedTokens) / totalRepoTokens) * 100);

    return {
      stats: {
        totalRepoFiles: 28,
        inspectedFilesCount: 17,
        selectedRelevantFilesCount: relevantFiles.length,
        uncompressedTokens: totalRepoTokens,
        compressedContextTokens: selectedTokens,
        contextEfficiencyRatio: efficiency,
        rankingFactors: {
          testErrorProximity: 96,
          dependencyGraphDistance: 92,
          symbolMatchStrength: 89,
          recentChangeRecency: 74,
        },
      },
      relevantFiles,
      fileExplanations: MOCK_WHY_THIS_FILE,
    };
  }
}
