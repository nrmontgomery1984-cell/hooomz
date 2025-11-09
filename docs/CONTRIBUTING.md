# Contributing to Hooomz Profile™

## Development Philosophy

We practice **"vibe coding"** - AI-assisted development with human oversight. This means:

- Use Claude Code for scaffolding and boilerplate
- Review all generated code for security and logic
- Prioritize boring, predictable code over clever solutions
- Write code that's easy to refactor

## Getting Started

1. **Clone the repo** (when available)
2. **Set up environment** - See [dev-setup.md](dev-setup.md)
3. **Create a feature branch** - `git checkout -b feature/your-feature`
4. **Make your changes**
5. **Test thoroughly**
6. **Submit a PR**

## Code Style

### JavaScript/React
- Use ES6+ syntax
- Functional components with hooks
- Keep components small and focused
- Use named exports for components
- Props destructuring preferred

### File Naming
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`
- Constants: `UPPER_SNAKE_CASE`

### Git Commits
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

Example: `feat: add material photo upload`

## Testing

- Write tests for critical business logic
- Test API endpoints with Postman/Insomnia
- Manual testing for UI components
- Test error states and edge cases

## Security

- Never commit `.env` files
- Validate all user inputs
- Use parameterized queries (Supabase handles this)
- Sanitize file uploads
- Check permissions on all data access

## Performance

- Lazy load routes with React.lazy()
- Optimize images before upload
- Use pagination for large datasets
- Index database foreign keys
- Cache static assets

## Pull Request Process

1. **Self-review** your code
2. **Update documentation** if needed
3. **Run tests** locally
4. **Request review** from Nate or William
5. **Address feedback** promptly
6. **Squash commits** before merge (if requested)

## Need Help?

- **Technical questions**: Ask Nate
- **Product questions**: Ask William
- **Stuck?**: Use Claude Code to debug

## License

By contributing, you agree that your contributions will be licensed under the project's proprietary license.
