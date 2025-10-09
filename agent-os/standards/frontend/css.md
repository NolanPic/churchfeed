## CSS best practices

- **Consistent Methodology**: Use CSS Modules as the default
- **Nest, but not deeply**: Use CSS nesting, but avoid going beyond 2 levels, and never go beyond 3
- **Avoid Overriding Framework Styles**: Work with your framework's patterns rather than fighting against them with excessive overrides
- **Maintain Design System**: Establish and document design tokens (colors, spacing, typography) for consistency
- **Minimize Custom CSS**: Leverage framework utilities and components to reduce custom CSS maintenance burden
- **Performance Considerations**: Optimize for production with CSS purging/tree-shaking to remove unused styles
