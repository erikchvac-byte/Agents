# Agent Method Signatures

## Logger
- **File:** agents/Logger.ts
- **Constructor:** Logger(logDir: string)
- **Public Methods:**
  - initialize(): Promise<void>
  - logAgentActivity(activity: AgentActivity): Promise<void>
  - logFailure(failure: FailureEvent): Promise<void>
  - logFix(fix: FixEvent): Promise<void>
  - pruneLogs(): Promise<void>
  - queryLogs(filter: LogFilter): Promise<string[]>

## SessionManager
- **File:** agents/SessionManager.ts
- **Constructor:** SessionManager(summaryPath: string, stateManager: StateManager)
- **Public Methods:**
  - initialize(): Promise<SessionSummary>
  - finalize(summary: SessionSummary): Promise<void>
  - validateSession(): Promise<boolean>
  - addAccomplishment(task: string): Promise<void>
  - addIncompleteTask(task: string): Promise<void>
  - updateSystemHealth(health: 'healthy' | 'degraded' | 'failed'): Promise<void>

## Router
- **File:** agents/Router.ts
- **Constructor:** Router(stateManager: StateManager, logger: Logger)
- **Public Methods:**
  - analyzeComplexity(task: string): Promise<ComplexityAnalysis>

## OllamaSpecialist
- **File:** agents/OllamaSpecialist.ts
- **Constructor:** OllamaSpecialist(stateManager: StateManager, logger: Logger, useMCP: boolean = true, workingDir: string = process.cwd())
- **Public Methods:**
  - checkAvailability(): Promise<boolean>
  - execute(task: string): Promise<ExecutionResult>

## ClaudeSpecialist
- **File:** agents/ClaudeSpecialist.ts
- **Constructor:** ClaudeSpecialist(_stateManager: StateManager, logger: Logger, workingDir: string = process.cwd())
- **Public Methods:**
  - execute(task: string): Promise<ExecutionResult>

## MetaCoordinator
- **File:** agents/MetaCoordinator.ts
- **Constructor:** MetaCoordinator(_stateManager: StateManager, logger: Logger)
- **Public Methods:**
  - route(task: string, complexity: TaskComplexity, forceAgent?: 'ollama-specialist' | 'claude-specialist'): Promise<RoutingDecision>
  - getStats(): Promise<Record<string, any>>

## Critic
- **File:** agents/Critic.ts
- **Constructor:** Critic(stateManager: StateManager)
- **Public Methods:**
  - reviewCode(diffs: CodeDiff[], requirements: string): Promise<CodeReview>
  - getLastReview(): Promise<CodeReview | null>

## Architect
- **File:** agents/Architect.ts
- **Constructor:** Architect(projectRoot: string, stateManager: StateManager)
- **Public Methods:**
  - analyzeProject(): Promise<ArchitecturalDesign>
  - recommendFileStructure(featureName: string, featureType: string): Promise<FileStructureRecommendation[]>
  - getCurrentDesign(): Promise<ArchitecturalDesign | null>

## RepairAgent
- **File:** agents/RepairAgent.ts
- **Constructor:** RepairAgent(stateManager: StateManager, logger: Logger, _workingDir: string = process.cwd())
- **Public Methods:**
  - repair(review: CodeReview, originalCode: string, filePath: string): Promise<RepairResult>

## AutoDebug
- **File:** agents/AutoDebug.ts
- **Constructor:** AutoDebug(_stateManager: StateManager, logger: Logger, _workingDir: string = process.cwd())
- **Public Methods:**
  - analyzeFailure(failure: FailureEvent): Promise<DebugResult>
  - analyzePatterns(failures: FailureEvent[]): Promise<{commonErrors: string[], mostAffectedAgent: string, timeDistribution: Record<string, number>, recommendations: string[]}>

## LogicArchivist
- **File:** agents/LogicArchivist.ts
- **Constructor:** LogicArchivist()
- **Public Methods:**
  - documentCode(code: string, filePath: string, language: string, options?: {taskComplexity?: number, codeComplexity?: number, existingComments?: string[]}): Promise<DocumentedCodeResult>
  - detectDarkCode(filePath: string): Promise<CodeSection[]>

## DependencyScout
- **File:** agents/DependencyScout.ts
- **Constructor:** DependencyScout(projectRoot: string, stateManager: StateManager)
- **Public Methods:**
  - scanDependencies(): Promise<DependencyReport>
  - checkConflicts(packages: PackageInfo[]): Promise<ConflictInfo[]>
  - checkMissingPeerDependencies(packages: PackageInfo[]): Promise<string[]>
  - checkSecurityVulnerabilities(packages: PackageInfo[]): Promise<VulnerabilityInfo[]>
  - validateDependencies(): Promise<boolean>
  - getLastReport(): Promise<DependencyReport | null>

## DataExtractor
- **File:** agents/DataExtractor.ts
- **Constructor:** DataExtractor(_stateManager: StateManager, logger: Logger, workingDir: string = process.cwd())
- **Public Methods:**
  - extractContext(targetDir: string = '.', recursive: boolean = true): Promise<ExtractionResult>
  - extractAPIs(filePaths: string[]): Promise<{functions: FunctionSignature[], types: TypeDefinition[]}>
  - generateSummary(context: CodeContext): string

## PerformanceMonitor
- **File:** agents/PerformanceMonitor.ts
- **Constructor:** PerformanceMonitor(_stateManager: StateManager, logger: Logger, _workingDir: string = process.cwd())
- **Public Methods:**
  - generateReport(lookbackMinutes: number = 60): Promise<PerformanceAnalysis>
  - monitorAgent(agentName: string, lookbackMinutes: number = 60): Promise<PerformanceMetrics | null>

## RoutingOptimizer
- **File:** agents/RoutingOptimizer.ts
- **Constructor:** RoutingOptimizer(_stateManager: StateManager, logger: Logger, _workingDir: string = process.cwd())
- **Public Methods:**
  - logDecision(decision: RoutingDecision): Promise<void>
  - analyzeAndOptimize(): Promise<OptimizationResult>
  - getStats(): Promise<{total_decisions: number, ollama_count: number, claude_count: number, override_rate: number}> | null
  - suggestThreshold(): Promise<number | null>
  - static getThreshold(): number
  - static setThreshold(newThreshold: number): void

## Watcher
- **File:** agents/Watcher.ts
- **Constructor:** Watcher(watchPath: string, stateManager: StateManager)
- **Public Methods:**
  - start(): Promise<void>
  - stop(): Promise<void>
  - onFileChange(callback: (event: FileChangeEvent) => void): void
  - getFileModificationTime(filePath: string): Promise<Date>
  - isActive(): boolean
