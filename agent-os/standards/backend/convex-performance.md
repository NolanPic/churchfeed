## Convex performance and query optimization best practices

- **Use withIndex Over filter**: Replace `.filter()` with `.withIndex()` conditions whenever filtering on indexed fields for better performance
- **Limit collect() Usage**: Only use `.collect()` for queries returning small (<1000) or bounded result sets; use `.paginate()` or `.take()` for potentially large datasets
- **Denormalize Counts**: Store counts as separate fields rather than loading all documents to count them; update counts in mutations that modify the data (or limit counts and use a bounded label like "99+")
- **Pagination for Large Lists**: Use `paginationOptsValidator` and `.paginate()` for any user-facing lists that could grow unbounded over time [[Docs](https://docs.convex.dev/database/pagination)]
- **Batch Related Data**: Load related documents together using Promise.all or helper libraries like `convex-helpers` to avoid sequential queries
- **Minimize Storage Reads**: Retrieve storage URLs only for data that will be displayed; avoid loading URLs for documents that may be filtered out later
- **Query Consistency**: Understand that multiple database queries within a function run in the same transaction and see consistent data [[Docs](https://docs.convex.dev/database/reading-data)]
- **Avoid Redundant Indexes**: Remove indexes that are prefixes of other indexes (e.g., remove `by_org` if `by_org_and_user` exists) to reduce storage overhead [[Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)]
