export class AgentManager {
  constructor() {}
  async executeTool(name, args) {
    // Minimal mock to satisfy WP2 runtime expectations
    return { name, args };
  }
  async cleanup() {}
}
