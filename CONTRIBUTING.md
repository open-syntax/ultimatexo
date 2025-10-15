# Contributing to UltimateXO

First off, thank you for considering contributing to UltimateXO! It's people like you that make UltimateXO such a great project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 8.x or higher
- **Rust** 1.75 or higher
- **Docker** and Docker Compose
- **Git**
- **just**

### Setting Up Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ultimatexo.git
   cd ultimatexo
   ```

2. **Install dependencies**
   ```bash
   just install
   # or manually:
   cd client && pnpm install
   cd ../server && cargo build
   ```

3. **Install pre-commit hooks**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Start development servers**
   ```bash
   # In separate terminals:
   cd client && pnpm run dev    # Client on :5173
   cd server && cargo run       # Server on :6767
   
   # Or use just:
   just dev
   ```

## Development Workflow

### Branch Strategy

We use a simplified Git Flow:

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features (optional)
- **`feature/*`** - New features
- **`fix/*`** - Bug fixes
- **`hotfix/*`** - Urgent production fixes
- **`chore/*`** - Maintenance tasks

### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   just test
   just lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

## Pull Request Process

### Before Submitting

- [ ] Run all tests: `just test`
- [ ] Run linters: `just lint`
- [ ] Update documentation if needed
- [ ] Add/update tests for your changes
- [ ] Update CHANGELOG.md
- [ ] Ensure CI passes

### PR Guidelines

1. **Use the PR template** - Fill out all sections
2. **Keep PRs focused** - One feature/fix per PR
3. **Write clear descriptions** - Explain what and why
4. **Add screenshots** - For UI changes
5. **Link related issues** - Use "Closes #123"
6. **Request reviews** - Tag relevant reviewers
7. **Be responsive** - Address review comments promptly

### PR Checklist

Your PR will be reviewed for:

- **Code quality** - Follows our coding standards
- **Tests** - Adequate test coverage
- **Documentation** - Changes are documented
- **Performance** - No significant performance degradation
- **Security** - No security vulnerabilities
- **Breaking changes** - Clearly marked and justified

### Review Process

1. **Automated checks** - CI must pass (tests, linting, security)
2. **Code review** - At least one approval required
3. **Testing** - Changes tested locally by reviewers
4. **Merge** - Squash and merge to main

## Coding Standards

### JavaScript/TypeScript (Client)

```typescript
// Use TypeScript for type safety
interface User {
  id: string;
  name: string;
  email: string;
}

// Use functional components with hooks
export const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Clear, descriptive names
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return <div>{user?.name}</div>;
};

// Use const for immutable values
const MAX_RETRIES = 3;

// Prefer async/await over promises
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
```

**Guidelines:**
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer functional programming patterns
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Keep components small and focused

### Rust (Server)

```rust
// Use idiomatic Rust
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
}

// Use Result for error handling
pub async fn get_user(id: Uuid) -> Result<User, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, name, email FROM users WHERE id = $1",
        id
    )
    .fetch_one(&pool)
    .await?;
    
    Ok(user)
}

// Document public APIs
/// Retrieves a user by their unique identifier.
///
/// # Arguments
/// * `id` - The UUID of the user to retrieve
///
/// # Errors
/// Returns `AppError::NotFound` if user doesn't exist
pub async fn fetch_user(id: Uuid) -> Result<User, AppError> {
    // Implementation
}
```

**Guidelines:**
- Follow `rustfmt` formatting
- Use `clippy` recommendations
- Write comprehensive error types
- Use `async/await` for I/O operations
- Add documentation comments
- Avoid `unwrap()` in production code
- Use proper error handling with `Result`

### General Principles

- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- **SOLID** principles
- **Composition over inheritance**
- **Write self-documenting code**

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples

```bash
feat(client): add user profile page

Implement a new user profile page with edit functionality.
Includes avatar upload and form validation.

Closes #123

---

fix(server): resolve database connection leak

Fixed a bug where database connections weren't being properly
released back to the pool after queries.

---

docs: update deployment guide

Add information about new environment variables and
health check endpoints.

---

chore(deps): update dependencies

Update all dependencies to latest versions.
- axios: 1.5.0 -> 1.6.0
- tokio: 1.35.0 -> 1.36.0
```

### Tips

- Use imperative mood: "add" not "added"
- Keep subject line under 50 characters
- Capitalize subject line
- No period at the end of subject line
- Wrap body at 72 characters
- Explain what and why, not how

## Testing

### Running Tests

```bash
# All tests
make test

# Client tests only
cd client && pnpm run test

# Server tests only
cd server && cargo test

# With coverage
make test-coverage
```

### Writing Tests

**Client (Jest/Vitest)**
```typescript
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user name', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('handles loading state', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

**Server (Rust)**
```rust
#[tokio::test]
async fn test_get_user() {
    let user_id = Uuid::new_v4();
    let result = get_user(user_id).await;
    
    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.id, user_id);
}

#[tokio::test]
async fn test_get_nonexistent_user() {
    let result = get_user(Uuid::new_v4()).await;
    assert!(result.is_err());
}
```

### Test Guidelines

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests independent
- Mock external dependencies

## Documentation

### What to Document

- **Public APIs** - All public functions/methods
- **Complex logic** - Non-obvious implementations
- **Configuration** - Environment variables, settings
- **Architecture** - High-level system design
- **Deployment** - Setup and deployment procedures

### Documentation Standards

- Use clear, concise language
- Include examples
- Keep documentation up to date
- Use diagrams where helpful
- Document breaking changes

### Where to Document

- **Code comments** - For inline documentation
- **README.md** - Project overview and quick start
- **CI/CD-GUIDE.md** - CI/CD specific documentation
- **API documentation** - Generated from code (Rustdoc, TSDoc)
- **Wiki** (future) - Detailed guides and tutorials

## Getting Help

- **GitHub Discussions** - For questions and discussions
- **GitHub Issues** - For bugs and feature requests
- **Discord/Slack** - For real-time chat (if available)

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- GitHub contributors page
- Release notes

Thank you for contributing! 🎉
