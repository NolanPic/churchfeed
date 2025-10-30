## Responsive design best practices

- **Mobile-First Development**: Start with mobile layout and progressively enhance for larger screens
- **Standard Breakpoints**: Consistently use standard breakpoints across the application (e.g., mobile, tablet, desktop). Use the defined breakpoints (e.g. `@media (--tablet)`) and do not use your own unless you have no other choice
- **Fluid Layouts**: Use percentage-based widths and flexible containers that adapt to screen size
- **Relative Units**: Use the defined spacing variables for padding and margin (e.g. from a globals.css or variables.css, etc.) instead of coming up with your own values. Prefer pixel values for exact widths/heights. Prefer rem/em units over fixed pixels for better scalability and accessibility in all other areas
- **Test Across Devices**: Test and verify UI changes across multiple screen sizes from mobile to tablet to desktop screen sizes and ensure a balanced, user-friendly viewing and reading experience on all
- **Touch-Friendly Design**: Ensure tap targets are appropriately sized (minimum 44x44px) for mobile users
- **Performance on Mobile**: Optimize images and assets for mobile network conditions and smaller screens
- **Readable Typography**: Maintain readable font sizes across all breakpoints without requiring zoom
