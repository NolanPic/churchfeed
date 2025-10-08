## Convex function best practices

- **Await All Promises**: Always await promises in async functions to avoid silent failures and ensure proper error handling
- **Use Argument Validators**: Define validators for all public function arguments using `v` validators to ensure type safety and runtime validation
- **Implement Access Control**: Always validate user permissions and organization membership before performing operations on protected resources
- **Helper Functions for Shared Logic**: Extract reusable logic into plain TypeScript helper functions that accept `ctx` as a parameter rather than using `ctx.runQuery` or `ctx.runMutation`
- **Schedule Only Internal Functions**: Use `internal` visibility for functions called via `ctx.scheduler` or `ctx.runMutation/Query/Action` to prevent unauthorized direct access
- **Combine Sequential Operations**: In actions, batch multiple `ctx.runQuery` or `ctx.runMutation` calls into a single transaction to ensure consistency and reduce overhead
- **Use runAction Sparingly**: Only use `ctx.runAction` when switching between Convex and Node.js runtimes; prefer plain TypeScript functions within the same runtime
- **Error Handling**: Throw descriptive errors with clear messages that can be safely shown to users or logged for debugging
