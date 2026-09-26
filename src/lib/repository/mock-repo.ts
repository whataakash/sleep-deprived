import { RepoFile, SymbolDefinition, WhyThisFile, RepositoryMetadata } from '@/types/repository';

export const DEFAULT_REPOSITORY: RepositoryMetadata = {
  id: 'forge-auth-service',
  name: 'auth-gateway-service',
  owner: 'devclub-systems',
  defaultBranch: 'main',
  branches: ['main', 'fix/session-token-forwarding', 'feat/rbac-v2'],
  description: 'Production authentication microservice with JWT session rotation & token forwarding.',
  framework: 'Node.js / TypeScript',
  packageManager: 'pnpm',
  totalFiles: 28,
  totalTokens: 42800,
  lastVerifiedCommit: 'c4f9a12',
};

export const MOCK_REPO_FILES: RepoFile[] = [
  {
    path: 'src',
    name: 'src',
    isDirectory: true,
    sizeBytes: 14200,
    children: [
      {
        path: 'src/auth',
        name: 'auth',
        isDirectory: true,
        sizeBytes: 8900,
        children: [
          {
            path: 'src/auth/client.ts',
            name: 'client.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 2420,
            language: 'typescript',
            content: `import { AuthSession, ApiResponse } from './types';

export class AuthServiceClient {
  private baseUrl: string;
  private currentSession: AuthSession | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\\/$/, '');
  }

  public setSession(session: AuthSession): void {
    this.currentSession = session;
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Forward outgoing request to internal services with session context.
   * BUG: Previously omitted Authorization header when session is active!
   */
  public async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers || {});
    
    // FIX APPLIED BY FORGE:
    if (this.currentSession && this.currentSession.token) {
      headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
      headers.set('X-Session-ID', this.currentSession.id);
    }

    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        error: \`Request failed with \${response.status}: \${errorText}\`,
      };
    }

    const data = (await response.json()) as T;
    return {
      success: true,
      status: response.status,
      data,
    };
  }
}
`,
          },
          {
            path: 'src/auth/session.ts',
            name: 'session.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 3100,
            language: 'typescript',
            content: `import { createHash, randomBytes } from 'crypto';
import { AuthSession, UserPayload } from './types';

export class SessionManager {
  private sessions = new Map<string, AuthSession>();

  public createSession(user: UserPayload, ttlSeconds = 3600): AuthSession {
    const id = randomBytes(16).toString('hex');
    const token = createHash('sha256')
      .update(\`\${id}:\${user.id}:\${Date.now()}\`)
      .digest('hex');

    const session: AuthSession = {
      id,
      userId: user.id,
      role: user.role,
      token,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    };

    this.sessions.set(id, session);
    return session;
  }

  public validateToken(token: string): AuthSession | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        if (session.expiresAt < Date.now()) {
          this.sessions.delete(session.id);
          return null;
        }
        return session;
      }
    }
    return null;
  }

  public revokeSession(id: string): boolean {
    return this.sessions.delete(id);
  }
}
`,
          },
          {
            path: 'src/auth/middleware.ts',
            name: 'middleware.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 1980,
            language: 'typescript',
            content: `import { SessionManager } from './session';
import { AuthSession } from './types';

export interface AuthenticatedRequest {
  headers: Record<string, string | undefined>;
  session?: AuthSession;
}

export function authMiddleware(sessionManager: SessionManager) {
  return (req: AuthenticatedRequest): { authenticated: boolean; statusCode?: number; error?: string } => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return { authenticated: false, statusCode: 401, error: 'Authorization header missing' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return { authenticated: false, statusCode: 401, error: 'Malformed authorization format' };
    }

    const token = parts[1];
    const session = sessionManager.validateToken(token);
    if (!session) {
      return { authenticated: false, statusCode: 401, error: 'Session token invalid or expired' };
    }

    req.session = session;
    return { authenticated: true };
  };
}
`,
          },
          {
            path: 'src/auth/types.ts',
            name: 'types.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 1100,
            language: 'typescript',
            content: `export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'engineer' | 'auditor';
}

export interface AuthSession {
  id: string;
  userId: string;
  role: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}
`,
          },
        ],
      },
      {
        path: 'src/server',
        name: 'server',
        isDirectory: true,
        sizeBytes: 3200,
        children: [
          {
            path: 'src/server/routes.ts',
            name: 'routes.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 2800,
            language: 'typescript',
            content: `import { SessionManager } from '../auth/session';
import { authMiddleware, AuthenticatedRequest } from '../auth/middleware';

export function setupRoutes(sessionManager: SessionManager) {
  const requireAuth = authMiddleware(sessionManager);

  return {
    handleProfileRequest(req: AuthenticatedRequest) {
      const auth = requireAuth(req);
      if (!auth.authenticated) {
        return { status: auth.statusCode || 401, body: { error: auth.error } };
      }
      return { status: 200, body: { profile: { userId: req.session?.userId, role: req.session?.role } } };
    }
  };
}
`,
          },
        ],
      },
    ],
  },
  {
    path: 'tests',
    name: 'tests',
    isDirectory: true,
    sizeBytes: 9800,
    children: [
      {
        path: 'tests/unit',
        name: 'unit',
        isDirectory: true,
        sizeBytes: 3200,
        children: [
          {
            path: 'tests/unit/session.test.ts',
            name: 'session.test.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 1850,
            language: 'typescript',
            content: `import { SessionManager } from '../../src/auth/session';

describe('SessionManager Unit Tests', () => {
  it('creates active session with valid expiration', () => {
    const manager = new SessionManager();
    const session = manager.createSession({ id: 'usr-1', email: 'test@devclub.in', role: 'engineer' }, 3600);
    expect(session.token).toBeDefined();
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('validates active session token successfully', () => {
    const manager = new SessionManager();
    const session = manager.createSession({ id: 'usr-2', email: 'audit@devclub.in', role: 'auditor' });
    const verified = manager.validateToken(session.token);
    expect(verified?.userId).toBe('usr-2');
  });
});
`,
          },
        ],
      },
      {
        path: 'tests/integration',
        name: 'integration',
        isDirectory: true,
        sizeBytes: 4100,
        children: [
          {
            path: 'tests/integration/auth.test.ts',
            name: 'auth.test.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 2450,
            language: 'typescript',
            content: `import { SessionManager } from '../../src/auth/session';
import { AuthServiceClient } from '../../src/auth/client';
import { setupRoutes } from '../../src/server/routes';

describe('Authentication Lifecycle Integration', () => {
  it('forwards session token and accesses protected profile route', async () => {
    const manager = new SessionManager();
    const routes = setupRoutes(manager);
    const client = new AuthServiceClient('http://localhost:8080');

    const session = manager.createSession({ id: 'usr-104', email: 'agent@forge.internal', role: 'engineer' });
    client.setSession(session);

    // Mock fetch binding
    global.fetch = jest.fn().mockImplementation(async (url, init) => {
      const authHeader = init?.headers?.get?.('Authorization') || init?.headers?.['Authorization'];
      const req = { headers: { authorization: authHeader } };
      const res = routes.handleProfileRequest(req as any);
      return {
        ok: res.status === 200,
        status: res.status,
        text: async () => JSON.stringify(res.body),
        json: async () => res.body,
      };
    });

    const result = await client.fetchWithAuth('/api/protected/profile');
    expect(result.status).toBe(200);
    expect(result.data?.profile?.userId).toBe('usr-104');
  });
});
`,
          },
        ],
      },
      {
        path: 'tests/regression',
        name: 'regression',
        isDirectory: true,
        sizeBytes: 2500,
        children: [
          {
            path: 'tests/regression/security.test.ts',
            name: 'security.test.ts',
            isDirectory: false,
            extension: 'ts',
            sizeBytes: 2100,
            language: 'typescript',
            content: `import { SessionManager } from '../../src/auth/session';
import { authMiddleware } from '../../src/auth/middleware';

describe('Security Regression Suite', () => {
  it('strictly rejects forged bearer tokens', () => {
    const manager = new SessionManager();
    const middleware = authMiddleware(manager);
    const result = middleware({ headers: { authorization: 'Bearer forged-random-token' } });
    expect(result.authenticated).toBe(false);
    expect(result.statusCode).toBe(401);
  });
});
`,
          },
        ],
      },
    ],
  },
  {
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    extension: 'json',
    sizeBytes: 680,
    language: 'json',
    content: `{
  "name": "auth-gateway-service",
  "version": "1.4.2",
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:regression": "jest tests/regression",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "build": "tsup src/server/index.ts --format esm,cjs"
  }
}
`,
  },
  {
    path: 'tsconfig.json',
    name: 'tsconfig.json',
    isDirectory: false,
    extension: 'json',
    sizeBytes: 420,
    language: 'json',
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
`,
  },
];

export const MOCK_SYMBOLS: SymbolDefinition[] = [
  {
    name: 'AuthServiceClient',
    kind: 'class',
    filePath: 'src/auth/client.ts',
    line: 3,
    signature: 'class AuthServiceClient',
    exported: true,
  },
  {
    name: 'fetchWithAuth',
    kind: 'method',
    filePath: 'src/auth/client.ts',
    line: 23,
    signature: 'public async fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>',
    exported: true,
  },
  {
    name: 'SessionManager',
    kind: 'class',
    filePath: 'src/auth/session.ts',
    line: 4,
    signature: 'class SessionManager',
    exported: true,
  },
  {
    name: 'authMiddleware',
    kind: 'function',
    filePath: 'src/auth/middleware.ts',
    line: 9,
    signature: 'function authMiddleware(sessionManager: SessionManager)',
    exported: true,
  },
  {
    name: 'setupRoutes',
    kind: 'function',
    filePath: 'src/server/routes.ts',
    line: 4,
    signature: 'function setupRoutes(sessionManager: SessionManager)',
    exported: true,
  },
];

export const MOCK_WHY_THIS_FILE: Record<string, WhyThisFile> = {
  'src/auth/client.ts': {
    filePath: 'src/auth/client.ts',
    relevanceScore: 98,
    reasons: [
      'Referenced by failing test `tests/integration/auth.test.ts`',
      'Contains outbound request orchestration `fetchWithAuth`',
      'Imports `AuthSession` and is responsible for header generation',
      'Direct cause of missing 401 Authorization header',
    ],
    dependentFiles: ['src/server/routes.ts'],
    importedBy: ['tests/integration/auth.test.ts'],
    referencedByFailingTests: ['tests/integration/auth.test.ts:42'],
  },
  'src/auth/session.ts': {
    filePath: 'src/auth/session.ts',
    relevanceScore: 88,
    reasons: [
      'Generates SHA256 session token verified by server',
      'Defines token structure consumed by client and middleware',
      'Dependency of `src/auth/client.ts`',
    ],
    dependentFiles: ['src/auth/client.ts', 'src/auth/middleware.ts'],
    importedBy: ['src/server/routes.ts', 'tests/unit/session.test.ts'],
    referencedByFailingTests: [],
  },
  'src/auth/middleware.ts': {
    filePath: 'src/auth/middleware.ts',
    relevanceScore: 84,
    reasons: [
      'Extracts `Bearer <token>` and returns 401 when absent',
      'Throws the error observed in failing integration run',
    ],
    dependentFiles: ['src/auth/session.ts'],
    importedBy: ['src/server/routes.ts'],
    referencedByFailingTests: ['tests/integration/auth.test.ts:18'],
  },
  'tests/integration/auth.test.ts': {
    filePath: 'tests/integration/auth.test.ts',
    relevanceScore: 95,
    reasons: [
      'Primary repro case for authentication timeout and missing credentials',
      'Contains assertion expecting HTTP 200 with profile payload',
      'Failed on Attempt 1 (401 Unauthorized)',
    ],
    dependentFiles: ['src/auth/client.ts', 'src/server/routes.ts'],
    importedBy: [],
    referencedByFailingTests: ['tests/integration/auth.test.ts:38'],
  },
};

export function findFileContent(path: string): string {
  function search(files: RepoFile[]): string | undefined {
    for (const f of files) {
      if (f.path === path && f.content) return f.content;
      if (f.children) {
        const found = search(f.children);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(MOCK_REPO_FILES) || '// File content not loaded or unavailable';
}
