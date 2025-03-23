# Contributing to OpenWebScoop

Thank you for your interest in contributing to OpenWebScoop! This document provides guidelines and steps for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible
* Include the URL of the webpage that caused the issue
* Include your Cloudflare Workers configuration (without sensitive information)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* A clear and descriptive title
* A detailed description of the proposed functionality
* Explain why this enhancement would be useful
* List any alternative solutions or features you've considered

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the TypeScript styleguides
* End all files with a newline

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Local Development Setup

1. Clone your fork:
```bash
git clone https://github.com/your-username/openWebScoop.git
cd openWebScoop
```

2. Install dependencies:
```bash
npm install
```

3. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

4. Make your changes and commit them:
```bash
git add .
git commit -m 'Add your feature'
```

5. Push to your fork:
```bash
git push origin feature/your-feature-name
```

### Testing

Before submitting a pull request, please ensure:

1. All tests pass:
```bash
npm test
```

2. Your code follows the project's coding standards:
```bash
npm run lint
```

3. Your code is properly formatted:
```bash
npm run format
```

## Code Style

* Use TypeScript for all new code
* Follow the existing code style
* Use meaningful variable and function names
* Add comments for complex logic
* Keep functions focused and small
* Use async/await for asynchronous operations
* Handle errors appropriately

## Documentation

* Update the README.md if needed
* Add JSDoc comments for new functions
* Update the API documentation if you change endpoints
* Include examples for new features

## Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐎 `:racehorse:` when improving performance
    * 🚱 `:non-potable_water:` when plugging memory leaks
    * 📝 `:memo:` when writing docs
    * 🐛 `:bug:` when fixing a bug
    * 🔥 `:fire:` when removing code or files
    * 💚 `:green_heart:` when fixing the CI build
    * ✅ `:white_check_mark:` when adding tests
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies

## Questions?

If you have any questions, please feel free to:

1. Open an issue
2. Join our discussions
3. Contact the maintainers

Thank you for contributing to OpenWebScoop! 