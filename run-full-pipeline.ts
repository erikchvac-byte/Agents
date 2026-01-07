/**
 * Full Pipeline Demo - All Agents Enabled
 *
 * Demonstrates the complete workflow with:
 * - Router (complexity analysis)
 * - Architect (planning for complex tasks)
 * - MetaCoordinator (routing)
 * - Ollama/Claude (execution)
 * - Critic (code review)
 */

import { Pipeline } from './pipeline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('='.repeat(80));
  console.log('FULL PIPELINE DEMO - All Agents Enabled');
  console.log('='.repeat(80));
  console.log();

  // Initialize pipeline with all agents enabled
  const pipeline = new Pipeline(
    process.cwd(), // working directory
    true, // useMCP = true (use real Ollama if available)
    true, // enableCritic = true
    true // enableArchitect = true
  );

  // Test 1: Simple task (Ollama)
  console.log('TEST 1: Simple Task (Ollama)');
  console.log('-'.repeat(80));
  const simpleResult = await pipeline.executeTask(
    'Add a function to calculate the factorial of a number'
  );
  console.log('\nResult:', {
    success: simpleResult.success,
    complexity: simpleResult.complexity,
    agent: simpleResult.assignedAgent,
    review: simpleResult.review,
    outputLength: simpleResult.output.length,
  });
  console.log('\nGenerated Code:');
  console.log(simpleResult.output);
  console.log();
  console.log('='.repeat(80));
  console.log();

  // Test 2: Complex task (Claude + Architect)
  console.log('TEST 2: Complex Task (Claude + Architect)');
  console.log('-'.repeat(80));
  const complexResult = await pipeline.executeTask(
    'Refactor the authentication system with OAuth 2.0 integration and proper security measures'
  );
  console.log('\nResult:', {
    success: complexResult.success,
    complexity: complexResult.complexity,
    agent: complexResult.assignedAgent,
    architecture: complexResult.architecturalGuidance,
    review: complexResult.review,
    outputLength: complexResult.output.length,
  });
  console.log('\nGenerated Code (first 500 chars):');
  console.log(complexResult.output.substring(0, 500) + '...');
  console.log();
  console.log('='.repeat(80));
  console.log();

  // Summary
  console.log('SUMMARY');
  console.log('-'.repeat(80));
  console.log(`✅ Simple Task: ${simpleResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   - Agent: ${simpleResult.assignedAgent}`);
  console.log(
    `   - Review: ${simpleResult.review?.verdict || 'N/A'} (${simpleResult.review?.issues || 0} issues)`
  );
  console.log(`   - Duration: ${simpleResult.totalDuration}ms`);
  console.log();
  console.log(`✅ Complex Task: ${complexResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   - Agent: ${complexResult.assignedAgent}`);
  console.log(
    `   - Architecture: ${complexResult.architecturalGuidance?.projectType || 'N/A'} (${complexResult.architecturalGuidance?.style || 'N/A'})`
  );
  console.log(
    `   - Review: ${complexResult.review?.verdict || 'N/A'} (${complexResult.review?.issues || 0} issues)`
  );
  console.log(`   - Duration: ${complexResult.totalDuration}ms`);
  console.log();
  console.log('='.repeat(80));
  console.log('✨ Full Pipeline Demo Complete!');
  console.log('='.repeat(80));
}

main().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
