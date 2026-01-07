/**
 * MVP Runner - Test the pipeline with a real task
 *
 * Usage: npm run mvp
 */

import { Pipeline } from './pipeline';

async function main() {
  console.log('=== Multi-Agent System MVP ===\n');

  const pipeline = new Pipeline();

  // Test task: Add a function to sum two numbers
  const task = 'Add a function to sum two numbers';

  console.log(`Task: "${task}"\n`);
  console.log('--- Pipeline Execution ---\n');

  const result = await pipeline.executeTask(task);

  console.log('\n--- Result ---\n');
  console.log(`Success: ${result.success}`);
  console.log(`Complexity: ${result.complexity}`);
  console.log(`Assigned Agent: ${result.assignedAgent}`);
  console.log(`Duration: ${result.totalDuration}ms`);

  if (result.success) {
    console.log('\n--- Generated Code ---\n');
    console.log(result.output);
  } else {
    console.log(`\nError: ${result.error}`);
  }

  console.log('\n--- Session State ---\n');
  const state = await pipeline.getState();
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== MVP Test Complete ===');

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
