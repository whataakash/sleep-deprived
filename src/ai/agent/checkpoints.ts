import { Checkpoint } from '@/types/harness';

export const INITIAL_CHECKPOINTS_1042: Checkpoint[] = [
  {
    id: 'chk-01',
    stepIndex: 0,
    name: 'Baseline Workspace State',
    description: 'Initial repository snapshot before any autonomous exploration or modification',
    timestamp: '10:42:01',
    gitCommitSha: '51ffd9d',
    filesSnapshot: [
      { path: 'src/auth/client.ts', action: 'modified', linesChanged: 0 },
      { path: 'tests/integration/auth.test.ts', action: 'modified', linesChanged: 0 },
    ],
    isRollbackTarget: false,
  },
  {
    id: 'chk-02',
    stepIndex: 4,
    name: 'Pre-Mutation Snapshot',
    description: 'Created automatically before executing edit_file on src/auth/client.ts',
    timestamp: '10:42:20',
    gitCommitSha: 'chk-pre-edit-8f2c',
    filesSnapshot: [
      { path: 'src/auth/client.ts', action: 'modified', linesChanged: 0 },
    ],
    isRollbackTarget: true,
  },
  {
    id: 'chk-03',
    stepIndex: 6,
    name: 'Post-Recovery Patch Applied',
    description: 'Header injection applied in AuthServiceClient (+14, -2 lines)',
    timestamp: '10:42:24',
    gitCommitSha: 'chk-patch-applied-9d11',
    filesSnapshot: [
      { path: 'src/auth/client.ts', action: 'modified', linesChanged: 16 },
    ],
    isRollbackTarget: false,
  },
  {
    id: 'chk-04',
    stepIndex: 9,
    name: 'Sealed & Verified State',
    description: 'Cryptographic proof sealed, zero diagnostics, all tests passed',
    timestamp: '10:42:36',
    gitCommitSha: 'chk-verified-e3b0c4',
    filesSnapshot: [
      { path: 'src/auth/client.ts', action: 'modified', linesChanged: 16 },
      { path: 'CHANGELOG.md', action: 'created', linesChanged: 28 },
    ],
    isRollbackTarget: false,
  },
];

export class CheckpointManager {
  private static checkpoints: Checkpoint[] = [...INITIAL_CHECKPOINTS_1042];
  private static activeCheckpointId: string = 'chk-04';

  public static getCheckpoints(): Checkpoint[] {
    return this.checkpoints;
  }

  public static rollbackToCheckpoint(checkpointId: string): {
    success: boolean;
    restoredCheckpoint: Checkpoint | undefined;
    message: string;
  } {
    const target = this.checkpoints.find((c) => c.id === checkpointId);
    if (!target) {
      return { success: false, restoredCheckpoint: undefined, message: 'Checkpoint not found' };
    }

    this.activeCheckpointId = target.id;
    return {
      success: true,
      restoredCheckpoint: target,
      message: `Successfully rolled back working tree to ${target.name} (${target.gitCommitSha})`,
    };
  }

  public static createCheckpoint(name: string, description: string): Checkpoint {
    const newCheckpoint: Checkpoint = {
      id: `chk-${Date.now()}`,
      stepIndex: this.checkpoints.length,
      name,
      description,
      timestamp: new Date().toLocaleTimeString(),
      gitCommitSha: Math.random().toString(16).substring(2, 9),
      filesSnapshot: [
        { path: 'src/auth/client.ts', action: 'modified', linesChanged: 14 },
      ],
    };
    this.checkpoints.push(newCheckpoint);
    return newCheckpoint;
  }
}
