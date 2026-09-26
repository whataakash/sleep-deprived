import fs from 'fs/promises';
import path from 'path';
import { ConsideredFile, SelectedFileContext, TargetedContextResult, TaskContract } from './types';

export class TargetedContextEngine {
  private static readonly IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'out',
    'build',
    'dist',
    'coverage',
    '.turbo',
  ]);

  private static readonly RELEVANT_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.sql',
  ]);

  /**
   * Discovers and retrieves minimum useful context for a task, staying strictly within token budget.
   */
  public static async assembleContext(
    task: string,
    repositoryRoot: string,
    contract?: TaskContract,
    tokenBudget: number = 8000
  ): Promise<TargetedContextResult> {
    const startTime = Date.now();
    const taskWords = this.extractKeywords(task);

    // 1. Traverse repository to discover relevant candidate files
    const allFiles = await this.scanDirectory(repositoryRoot, repositoryRoot);

    // 2. Score candidate files
    const scoredFiles: ConsideredFile[] = [];
    for (const file of allFiles) {
      // Check contract forbidden paths
      if (contract?.forbiddenPaths.some(p => file.relativePath.includes(p.replace(/\*/g, '')))) {
        continue;
      }

      const score = this.calculateRelevance(file.relativePath, file.content, taskWords, contract);
      if (score.score > 0) {
        scoredFiles.push({
          path: file.relativePath,
          matchScore: score.score,
          reason: score.reason,
          sizeBytes: file.content.length,
        });
      }
    }

    // Sort descending by score
    scoredFiles.sort((a, b) => b.matchScore - a.matchScore);

    // 3. Select top files within token budget
    const selectedFiles: SelectedFileContext[] = [];
    const indexedSymbols: { symbol: string; file: string; line: number }[] = [];
    let currentTokens = 0;
    let budgetExceeded = false;

    for (const candidate of scoredFiles) {
      const fullPath = path.resolve(repositoryRoot, candidate.path);
      let content = '';
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch {
        continue;
      }

      const estimatedTokens = Math.ceil(content.length / 4);
      if (currentTokens + estimatedTokens > tokenBudget && selectedFiles.length > 0) {
        budgetExceeded = true;
        // If file is very large, consider taking only relevant symbol snippets
        const trimmed = this.extractKeySnippets(content, taskWords);
        const trimmedTokens = Math.ceil(trimmed.length / 4);
        if (currentTokens + trimmedTokens <= tokenBudget) {
          const symbols = this.extractSymbols(trimmed, candidate.path, indexedSymbols);
          selectedFiles.push({
            path: candidate.path,
            reason: candidate.reason + ' (trimmed to salient snippets for token budget)',
            tokensEstimate: trimmedTokens,
            content: trimmed,
            symbols,
          });
          currentTokens += trimmedTokens;
        }
        break;
      }

      const symbols = this.extractSymbols(content, candidate.path, indexedSymbols);
      selectedFiles.push({
        path: candidate.path,
        reason: candidate.reason,
        tokensEstimate: estimatedTokens,
        content,
        symbols,
      });
      currentTokens += estimatedTokens;

      // Keep at most 5 files to preserve razor-sharp context focus
      if (selectedFiles.length >= 5) {
        break;
      }
    }

    return {
      task,
      filesConsidered: scoredFiles.slice(0, 15),
      filesSelected: selectedFiles,
      totalTokensEstimate: currentTokens,
      tokenBudget,
      budgetExceeded,
      indexedSymbols,
      durationMs: Date.now() - startTime,
    };
  }

  private static extractKeywords(task: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'when', 'all', 'into',
      'across', 'ensure', 'pass', 'fix', 'run', 'make', 'all', 'any', 'should',
    ]);
    return task
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }

  private static async scanDirectory(
    dir: string,
    root: string,
    depth: number = 0
  ): Promise<{ relativePath: string; content: string }[]> {
    if (depth > 6) return [];
    const results: { relativePath: string; content: string }[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(root, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (!this.IGNORED_DIRS.has(entry.name)) {
            const sub = await this.scanDirectory(fullPath, root, depth + 1);
            results.push(...sub);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.RELEVANT_EXTENSIONS.has(ext)) {
            try {
              // Read content with a cap of 64KB per file scan to prevent memory bloat
              const stat = await fs.stat(fullPath);
              if (stat.size <= 128 * 1024) {
                const content = await fs.readFile(fullPath, 'utf-8');
                results.push({ relativePath: relPath, content });
              }
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    } catch {
      // Ignore unreadable directories
    }

    return results;
  }

  private static calculateRelevance(
    relPath: string,
    content: string,
    keywords: string[],
    contract?: TaskContract
  ): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];
    const lowerPath = relPath.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Direct match with contract allowed paths
    if (contract?.allowedPaths.some(p => lowerPath.includes(p.replace(/\*/g, '')))) {
      score += 40;
      reasons.push('Explicitly in contract scope');
    }

    for (const kw of keywords) {
      if (lowerPath.includes(kw)) {
        score += 30;
        reasons.push(`Path matches keyword '${kw}'`);
      }
      // Content matches
      const occurrences = (lowerContent.match(new RegExp(kw, 'g')) || []).length;
      if (occurrences > 0) {
        score += Math.min(25, occurrences * 5);
        reasons.push(`Contains '${kw}' (${occurrences}x)`);
      }
    }

    // Boost test files associated with matched sources
    if (lowerPath.includes('.test.') || lowerPath.includes('.spec.')) {
      score += 15;
      reasons.push('Automated verification suite');
    }

    return {
      score,
      reason: reasons.slice(0, 3).join('; ') || 'General repository context',
    };
  }

  private static extractSymbols(
    content: string,
    filePath: string,
    accumulator: { symbol: string; file: string; line: number }[]
  ): string[] {
    const symbolList: string[] = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const match = line.match(/export\s+(?:default\s+)?(?:function|class|interface|type|const)\s+([A-Za-z0-9_$]+)/);
      if (match && match[1]) {
        symbolList.push(match[1]);
        accumulator.push({
          symbol: match[1],
          file: filePath,
          line: idx + 1,
        });
      }
    });

    return symbolList;
  }

  private static extractKeySnippets(content: string, keywords: string[]): string {
    const lines = content.split('\n');
    const matchedLineIndices = new Set<number>();

    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 5); i++) {
          matchedLineIndices.add(i);
        }
      }
    });

    if (matchedLineIndices.size === 0) {
      return lines.slice(0, 80).join('\n') + '\n// ... [trimmed]';
    }

    const sortedIndices = Array.from(matchedLineIndices).sort((a, b) => a - b);
    const snippets: string[] = [];
    let lastIdx = -1;

    for (const idx of sortedIndices) {
      if (lastIdx !== -1 && idx > lastIdx + 1) {
        snippets.push('// ... [context gap] ...');
      }
      snippets.push(lines[idx]);
      lastIdx = idx;
    }

    return snippets.join('\n');
  }
}
