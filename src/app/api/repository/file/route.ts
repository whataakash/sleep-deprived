import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get('path');

    if (!relPath) {
      return NextResponse.json({ error: 'Missing path query parameter' }, { status: 400 });
    }

    const root = process.cwd();
    const resolvedPath = path.resolve(/*turbopackIgnore: true*/ root, relPath);

    // Prevent directory traversal attacks
    if (!resolvedPath.startsWith(root)) {
      return NextResponse.json({ error: 'Access denied: path outside workspace root' }, { status: 403 });
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      const lines = content.split('\n');
      return NextResponse.json({
        path: relPath,
        content,
        linesCount: lines.length,
        sizeBytes: Buffer.byteLength(content, 'utf-8'),
      });
    } catch (err: any) {
      return NextResponse.json({ error: `File not found or unreadable: ${err.message}` }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
