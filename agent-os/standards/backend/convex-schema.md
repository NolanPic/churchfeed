## Convex schema and data modeling best practices

- **Define Schema Explicitly**: Always define schemas in `schema.ts` using `defineSchema` and `defineTable` for type safety and documentation [[Docs](https://docs.convex.dev/database/schemas)]
- **Index Strategic Fields**: Create indexes for fields used in `withIndex` conditions, especially for foreign keys and commonly filtered fields
- **Composite Indexes Over Multiple**: Use composite indexes (e.g., `by_org_and_user`) instead of separate indexes to reduce storage overhead and improve query performance [[Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)]
- **Organization Scoping**: Include `orgId` as the first field in composite indexes for multi-tenant applications to enable efficient organization-level queries
- **Timestamp Fields**: Include `updatedAt` timestamps on all tables for auditing; `_creationTime` is automatically available for all documents
- **Appropriate Data Types**: Use specific validators (`v.id()`, `v.union()`, `v.literal()`) rather than generic strings to enforce data integrity at the schema level
- **Optional Fields**: Use `v.optional()` for fields that may not be present, but prefer required fields with defaults when possible for consistency
- **Relationship Clarity**: Use `v.id("tableName")` for foreign keys to make relationships explicit and enable better type inference
