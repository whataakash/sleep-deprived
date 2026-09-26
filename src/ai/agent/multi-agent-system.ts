import { AgentParticipant } from '@/types/harness';

export const INITIAL_MULTI_AGENT_TEAM: AgentParticipant[] = [
  {
    id: 'navigator',
    displayName: 'Navigating AI',
    role: 'AST Cartographer & Context Planner',
    avatarIcon: 'Compass',
    color: '#38bdf8',
    badgeLabel: 'NAVIGATOR',
    status: 'ACTIVE',
    currentAction: 'Indexed 28 files across repository; resolved AuthServiceClient call graph.',
    stats: {
      'Files Scanned': 28,
      'Symbols Indexed': 142,
      'Context Efficiency': '88% (-141.7k tokens)',
      'Candidate Targets': 4,
    },
    recentThoughts: [
      {
        timestamp: '10:42:02',
        thought: 'Scanned repository AST: located AuthServiceClient in src/auth/client.ts with 98% relevance.',
        category: 'navigate',
      },
      {
        timestamp: '10:42:07',
        thought: 'Formulated 4-step execution plan focused exclusively on session token header injection.',
        category: 'plan',
      },
      {
        timestamp: '10:42:21',
        thought: 'Traced failure root cause: fetchWithAuth initiates RequestInit without bearer authorization token.',
        category: 'navigate',
      },
    ],
  },
  {
    id: 'supervisor',
    displayName: 'Supervisor AI',
    role: 'Safety, Scope & Invariant Verifier',
    avatarIcon: 'ShieldCheck',
    color: '#10b981',
    badgeLabel: 'SUPERVISOR',
    status: 'VERIFYING',
    currentAction: 'All Scope, Security, and Invariant checks satisfied. Sealed Proof SHA-256.',
    stats: {
      'Scope Violations': 0,
      'Security Leaks': 0,
      'Loop Cycles': 0,
      'Regression Invariants': '4/4 Passed',
    },
    recentThoughts: [
      {
        timestamp: '10:42:03',
        thought: 'Scope Guard active: Quarantined .env and database schemas. Set src/auth/* as mutable target.',
        category: 'safety',
      },
      {
        timestamp: '10:42:15',
        thought: 'Baseline test reproduction failed with HTTP 401 as predicted. Verified no environmental fault.',
        category: 'audit',
      },
      {
        timestamp: '10:42:24',
        thought: 'Human Approval Gate evaluated: Approved patch to src/auth/client.ts (+14 lines, -2 lines).',
        category: 'safety',
      },
      {
        timestamp: '10:42:36',
        thought: 'Final Verification: Typecheck PASS, Lint PASS, 0 Regressions. Generated Merkle proof root.',
        category: 'verify',
      },
    ],
  },
];

export class MultiAgentSystem {
  private static team: AgentParticipant[] = [...INITIAL_MULTI_AGENT_TEAM];

  public static getTeam(): AgentParticipant[] {
    return this.team;
  }

  public static getNavigator(): AgentParticipant {
    return this.team[0];
  }

  public static getSupervisor(): AgentParticipant {
    return this.team[1];
  }
}
