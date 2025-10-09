## General development conventions

- **Consistent Project Structure**: Organize files and directories in a predictable, logical structure that team members can navigate easily
- **Clear Documentation**: Maintain up-to-date README files with setup instructions, architecture overview, and contribution guidelines
- **Version Control Best Practices**: Use clear commit messages, feature branches, and meaningful pull/merge requests with descriptions
- **Environment Configuration**: Use environment variables for configuration; never commit secrets or API keys to version control
- **Dependency Management**: Keep dependencies up-to-date and minimal; document why major dependencies are used
- **Testing Requirements**: Define what level of testing is required before merging (feature flag, e2e, integration, unit, etc.)
  <ignore reason="We are still in active development, so feature flags are not needed yet">
- **Feature Flags**: Use feature flags for incomplete features rather than long-lived feature branches, and also for testing complete features before general release
  </ignore>
- **Changelog Maintenance**: Keep a changelog or release notes to track significant changes and improvements. This should have a medium-level of detail, so that it can be used both for developers and also be fed into an LLM for generating customer-facing release notes
