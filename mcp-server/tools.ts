import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const AGENT_TOOLS: Tool[] = [
  {
    name: 'analyze_task_complexity',
    description: 'Analyzes task complexity using Router agent',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to analyze',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'route_task',
    description: 'Routes a task to appropriate execution agent using MetaCoordinator',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to route',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'complex'],
          description: 'Task complexity classification',
        },
        forceAgent: {
          type: 'string',
          enum: ['ollama-specialist', 'claude-specialist'],
          description: 'Optional override to force specific execution agent',
        },
      },
      required: ['task', 'complexity'],
    },
  },
  {
    name: 'execute_simple_task',
    description: 'Executes simple tasks using Ollama local LLM',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The simple task to execute',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'execute_complex_task',
    description: 'Executes complex tasks using Claude Sonnet',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The complex task to execute',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'review_code',
    description: 'Reviews code changes for quality, security, and performance issues using Critic agent',
    inputSchema: {
      type: 'object',
      properties: {
        diffs: {
          type: 'array',
          description: 'Array of code diffs to review',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              additions: { type: 'array', items: { type: 'string' } },
              deletions: { type: 'array', items: { type: 'string' } },
              context: { type: 'string' },
            },
          },
        },
        requirements: {
          type: 'string',
          description: 'Requirements code should meet',
        },
      },
      required: ['diffs', 'requirements'],
    },
  },
  {
    name: 'analyze_architecture',
    description: 'Analyzes project structure and architectural patterns using Architect agent',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_architectural_guidance',
    description: 'Recommends file structure for new features using Architect agent',
    inputSchema: {
      type: 'object',
      properties: {
        featureName: {
          type: 'string',
          description: 'Name of feature',
        },
        featureType: {
          type: 'string',
          description: 'Type of feature (agent, component, etc.)',
        },
      },
      required: ['featureName', 'featureType'],
    },
  },
  {
    name: 'repair_code',
    description: 'Repairs code issues identified by Critic using RepairAgent',
    inputSchema: {
      type: 'object',
      properties: {
        review: {
          type: 'object',
          description: 'Code review from Critic containing issues to fix',
          properties: {
            verdict: {
              type: 'string',
              enum: ['approved', 'needs_repair', 'rejected'],
              description: 'Code review verdict',
            },
            issues: {
              type: 'array',
              description: 'List of code issues found',
              items: {
                type: 'object',
                properties: {
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Issue severity level',
                  },
                  category: {
                    type: 'string',
                    enum: ['logic', 'style', 'security', 'performance', 'maintainability'],
                    description: 'Issue category',
                  },
                  description: { type: 'string', description: 'Issue description' },
                  location: { type: 'string', description: 'Location in code (optional)' },
                  suggestedFix: { type: 'string', description: 'Suggested fix (optional)' },
                },
                required: ['severity', 'category', 'description'],
              },
            },
            summary: { type: 'string', description: 'Overall review summary' },
            recommendations: {
              type: 'array',
              description: 'List of recommendations',
              items: { type: 'string' },
            },
            securityConcerns: {
              type: 'array',
              description: 'Security issues found',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Concern type (e.g., "injection", "xss")' },
                  description: { type: 'string', description: 'Concern description' },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Severity level',
                  },
                  recommendation: { type: 'string', description: 'Recommended fix' },
                },
                required: ['type', 'description', 'severity', 'recommendation'],
              },
            },
            performanceIssues: {
              type: 'array',
              description: 'Performance issues found',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: 'Issue type (e.g., "n+1", "blocking")' },
                  description: { type: 'string', description: 'Issue description' },
                  impact: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Performance impact level',
                  },
                  suggestion: { type: 'string', description: 'Suggested improvement' },
                },
                required: ['type', 'description', 'impact', 'suggestion'],
              },
            },
            reviewed_at: {
              type: 'string',
              description: 'ISO 8601 timestamp of when review was completed',
            },
          },
          required: ['verdict', 'issues', 'summary', 'recommendations', 'securityConcerns', 'performanceIssues', 'reviewed_at'],
        },
        originalCode: {
          type: 'string',
          description: 'Original code that was reviewed',
        },
        filePath: {
          type: 'string',
          description: 'File path being repaired',
        },
      },
      required: ['review', 'originalCode', 'filePath'],
    },
  },
  {
    name: 'analyze_error',
    description: 'Analyzes failure events and identifies root causes using AutoDebug',
    inputSchema: {
      type: 'object',
      properties: {
        failure: {
          type: 'object',
          description: 'Failure event to analyze',
          properties: {
            timestamp: { type: 'string' },
            agent: { type: 'string' },
            error: { type: 'string' },
            task: { type: 'string' },
            retry_count: { type: 'number' },
          },
        },
      },
      required: ['failure'],
    },
  },
  {
    name: 'document_code',
    description: 'Documents code with intent-focused comments using LogicArchivist',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code to document',
        },
        filePath: {
          type: 'string',
          description: 'File path of code',
        },
        language: {
          type: 'string',
          description: 'Programming language (typescript, javascript, python, etc.)',
        },
        taskComplexity: {
          type: 'number',
          description: 'Task complexity score (0-100)',
        },
        codeComplexity: {
          type: 'number',
          description: 'Code complexity score',
        },
      },
      required: ['code', 'filePath', 'language'],
    },
  },
  {
    name: 'analyze_dependencies',
    description: 'Scans dependencies and generates comprehensive report using DependencyScout',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'extract_data',
    description: 'Extracts code context from a directory using DataExtractor',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: {
          type: 'string',
          description: 'Directory to analyze (relative to working directory)',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to analyze subdirectories',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_performance_metrics',
    description: 'Generates comprehensive performance report using PerformanceMonitor',
    inputSchema: {
      type: 'object',
      properties: {
        lookbackMinutes: {
          type: 'number',
          description: 'How far back to analyze in minutes (default: 60)',
        },
      },
      required: [],
    },
  },
  {
    name: 'optimize_routing',
    description: 'Analyzes routing patterns and generates optimization recommendations using RoutingOptimizer',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'start_session',
    description: 'Initializes session - reads existing or creates new using SessionManager',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'end_session',
    description: 'Finalizes session on shutdown using SessionManager',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          description: 'Session summary to finalize',
          properties: {
            session_id: {
              type: 'string',
              description: 'Unique session identifier (UUID format)',
            },
            start_time: {
              type: 'string',
              description: 'Session start time (ISO 8601 timestamp)',
            },
            end_time: {
              type: ['string', 'null'],
              description: 'Session end time (ISO 8601 timestamp, null if ongoing)',
            },
            accomplished: {
              type: 'array',
              description: 'List of completed tasks during this session',
              items: { type: 'string' },
            },
            next_steps: {
              type: 'array',
              description: 'Planned next actions for future sessions',
              items: { type: 'string' },
            },
            incomplete_tasks: {
              type: 'array',
              description: 'List of unfinished tasks from this session',
              items: { type: 'string' },
            },
            system_health: {
              type: 'string',
              enum: ['healthy', 'degraded', 'failed'],
              description: 'Overall system health status',
            },
          },
          required: ['session_id', 'start_time', 'accomplished', 'next_steps', 'incomplete_tasks', 'system_health'],
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'get_recent_logs',
    description: 'Query logs with optional filters using Logger',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description: 'Filter by agent name',
        },
        start_date: {
          type: 'string',
          description: 'Filter by start date (ISO format)',
        },
        end_date: {
          type: 'string',
          description: 'Filter by end date (ISO format)',
        },
        error_type: {
          type: 'string',
          description: 'Filter by error type',
        },
      },
      required: [],
    },
  },
  {
    name: 'ping',
    description: 'Test stub - returns OK if MCP server is alive',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
