import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface TreeNode {
  path: string;
  name: string;
  isDirectory: boolean;
  sizeBytes?: number;
  extension?: string;
  children?: TreeNode[];
}

const IGNORED = new Set([
  '.git',
  'node_modules',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'build',
  '.parishram',
]);

async function buildTree(dir: string, baseDir: string): Promise<TreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const children = await buildTree(fullPath, baseDir);
      nodes.push({
        path: relPath,
        name: entry.name,
        isDirectory: true,
        children,
      });
    } else {
      let sizeBytes = 0;
      try {
        const stat = await fs.stat(fullPath);
        sizeBytes = stat.size;
      } catch {
        // ignore
      }
      nodes.push({
        path: relPath,
        name: entry.name,
        isDirectory: false,
        sizeBytes,
        extension: path.extname(entry.name).replace('.', ''),
      });
    }
  }

  // Sort folders first, then files alphabetically
  nodes.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export async function GET() {
  try {
    const root = process.cwd();
    const tree = await buildTree(root, root);
    return NextResponse.json({
      repositoryName: path.basename(root),
      repositoryRoot: root,
      files: tree,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
