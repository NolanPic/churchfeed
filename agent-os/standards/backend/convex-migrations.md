## Migration best practices

- **Prefer Online Migrations**: Run migrations asynchronously while serving traffic to avoid downtime; handle both old and new data formats during the transition [[Stack](https://stack.convex.dev/intro-to-migrations)]
- **Add Fields, Don't Change Types**: Create new fields with `v.union()` of old and new types rather than changing existing field types; Convex schema validation will reject type changes that don't match production data [[Stack](https://stack.convex.dev/intro-to-migrations)]
- **Mark as Deprecated, Don't Delete**: Use `v.optional()` and code comments to deprecate fields instead of deleting them; only remove fields from schema after migrating all data [[Stack](https://stack.convex.dev/intro-to-migrations)]
- **Separate Schema from Code Deploys**: Push schema changes (adding optional fields) before code changes that use those fields to enable safe rollbacks [[Stack](https://stack.convex.dev/intro-to-migrations)]
- **Use Dual Writes**: Deploy code that writes both old and new formats while reading old format, then migrate data, then switch reads to new format for safe rollback capability [[Stack](https://stack.convex.dev/intro-to-migrations)]
- **Batch Data Mutations**: Write mutations that process data in small batches to avoid timeouts; use scheduled functions or actions to orchestrate large migrations [[Docs](https://docs.convex.dev/scheduling)]
- **Clean Up After Migration**: Remove dual-read/write code and deprecated fields only after confirming all data is migrated and no readers or writers of the old format remain
