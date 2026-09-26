import fs from 'fs/promises';
import path from 'path';
import { CheckpointSnapshot } from './types';

export class HarnessCheckpointManager {
  private repositoryRoot: string;
  private snapshots: CheckpointSnapshot[] = [];

  constructor(repositoryRoot: string = process.cwd()) {
    this.repositoryRoot = repositoryRoot;
  }

  /**
   * Captures the exact state of specified files before modifications occur.
   */
  public async createCheckpoint(
    name: string,
    description: string,
    filesToSnapshot: string[]
  ): Promise<CheckpointSnapshot> {
    const id = 'chk-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const files: { path: string; originalContent: string | null }[] = [];

    for (const relPath of filesToSnapshot) {
      const fullPath = path.resolve(this.repositoryRoot, relPath);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        files.push({ path: relPath, originalContent: content });
      } catch {
        // File does not exist yet (will be created in this step)
        files.push({ path: relPath, originalContent: null });
      }
    }

    const snapshot: CheckpointSnapshot = {
      id,
      name,
      description,
      timestamp: new Date().toISOString(),
      files,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Restores files to their exact state at the given checkpoint, undoing corrupt or broken modifications.
   */
  public async rollbackToCheckpoint(checkpointId: string): Promise<{
    success: boolean;
    restoredFilesCount: number;
    message: string;
  }> {
    const snapshot = this.snapshots.find((s) => s.id === checkpointId);
    if (!snapshot) {
      return {
        success: false,
        restoredFilesCount: 0,
        message: `Checkpoint ${checkpointId} not found`,
      };
    }

    let restoredCount = 0;
    for (const file of snapshot.files) {
      const fullPath = path.resolve(this.repositoryRoot, file.path);
      try {
        if (file.originalContent !== null) {
          // Restore original content
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, file.originalContent, 'utf-8');
          restoredCount++;
        } else {
          // The file did not exist before this checkpoint; remove it if it was created
          try {
            await fs.unlink(fullPath);
            restoredCount++;
          } catch {
            // Already absent
          }
        }
      } catch (err: any) {
        console.error(`Rollback error for file ${file.path}:`, err);
      }
    }

    return {
      success: true,
      restoredFilesCount: restoredCount,
      message: `Successfully rolled back ${restoredCount} files to checkpoint '${snapshot.name}' (${snapshot.id})`,
    };
  }

  public getCheckpoints(): CheckpointSnapshot[] {
    return [...this.snapshots];
  }

  public getLatestCheckpoint(): CheckpointSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }
}
