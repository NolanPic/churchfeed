## Testing best practices

- **Build Safety Nets, Not Guardrails**: Focus on tools and processes that enable rapid recovery from mistakes rather than trying to prevent every possible error upfront
- **Test Where It Matters**: Reserve unit tests for complex libraries with intricate type contracts; avoid testing application code where TypeScript and quick iteration provide better value. Use integration tests and e2e tests only on critical user paths
  <ignore reason="We are still in active development, so feature flags are not needed yet">
  - **Test in Production with Control**: Use feature flags, real user monitoring, and gradual rollouts to validate code with actual users while minimizing blast radius
  - **Deploy Continuously, Release Incrementally**: Separate deployment from release using feature flags on medium-to-large features. Code goes to production but reaches users progressively (developers → staff → beta → everyone)
    </ignore>
- **Fail Small, Recover Fast**: Prioritize rapid identification and rollback capabilities over extensive pre-deployment testing; maintain quick deployment cycles and responsive monitoring
