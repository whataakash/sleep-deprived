import { HumanApprovalGate } from '@/types/harness';

export const INITIAL_APPROVAL_REQUESTS: HumanApprovalGate[] = [
  {
    id: 'gate-01',
    actionType: 'CORE_AUTH_EDIT',
    title: 'Outbound Client Session Token Injection',
    description: 'Modifies core HTTP header serialization in AuthServiceClient.fetchWithAuth() to forward active Bearer token.',
    riskLevel: 'MEDIUM',
    targetFiles: ['src/auth/client.ts'],
    diffPreview: `+ if (this.currentSession && this.currentSession.token) {
+   headers.set('Authorization', \`Bearer \${this.currentSession.token}\`);
+   headers.set('X-Session-ID', this.currentSession.id);
+ }`,
    requestedAt: '10:42:23',
    status: 'APPROVED',
    decidedAt: '10:42:24',
    reviewerNotes: 'Approved: strictly adheres to Task Contract and passes regression safeguards.',
  },
  {
    id: 'gate-02',
    actionType: 'SCHEMA_MIGRATION',
    title: 'Drop Deprecated Legacy Auth Column',
    description: 'Autonomous planner proposed dropping legacy "temp_token" column from auth schema.',
    riskLevel: 'HIGH',
    targetFiles: ['src/database/schema.sql'],
    diffPreview: `- ALTER TABLE sessions DROP COLUMN temp_token;`,
    requestedAt: '10:42:09',
    status: 'REJECTED',
    decidedAt: '10:42:10',
    reviewerNotes: 'Rejected: Schema changes are out-of-scope for run-1042.',
  },
];

export class ApprovalGateEngine {
  private static requests: HumanApprovalGate[] = [...INITIAL_APPROVAL_REQUESTS];

  public static getRequests(): HumanApprovalGate[] {
    return this.requests;
  }

  public static decideRequest(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    notes?: string
  ): { success: boolean; request?: HumanApprovalGate } {
    const req = this.requests.find((r) => r.id === id);
    if (!req) return { success: false };
    req.status = decision;
    req.decidedAt = new Date().toLocaleTimeString();
    if (notes) req.reviewerNotes = notes;
    return { success: true, request: req };
  }

  public static createRequest(
    actionType: HumanApprovalGate['actionType'],
    title: string,
    description: string,
    riskLevel: HumanApprovalGate['riskLevel'],
    targetFiles: string[],
    diffPreview: string
  ): HumanApprovalGate {
    const req: HumanApprovalGate = {
      id: `gate-${Date.now()}`,
      actionType,
      title,
      description,
      riskLevel,
      targetFiles,
      diffPreview,
      requestedAt: new Date().toLocaleTimeString(),
      status: 'PENDING',
    };
    this.requests.unshift(req);
    return req;
  }
}
