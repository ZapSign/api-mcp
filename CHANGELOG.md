# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-12-28

### Changed
- **BREAKING CHANGE**: Merged `ZAPSIGN_API_KEY` and `ZAPSIGN_WORKSPACE_API_KEY` into single `ZAPSIGN_API_KEY` configuration
- Simplified authentication configuration - now only requires one API key
- Updated all tools to use centralized authentication service
- Removed dual API key complexity from configuration and documentation

### Technical Improvements
- Centralized authentication logic in `authService`
- Simplified configuration schema
- Updated all tool files to use `authService.getApiKey()` instead of direct environment variable access
- Improved code maintainability and consistency

## [1.0.0-beta.1] - 2024-12-28

### Added
- Initial release of MCP ZapSign Server
- Complete MCP (Model Context Protocol) server implementation
- Comprehensive ZapSign API integration with all documented endpoints
- Support for both STDIO and SSE (Server-Sent Events) modes
- Authentication service with dual API key support (main + workspace)
- Input validation using Zod schemas for all API operations
- Structured logging with Winston
- Health monitoring with `/health` endpoint
- Configuration management with environment variable validation
- Error handling with detailed context information
- Docker and Docker Compose support for easy deployment
- Comprehensive documentation and setup instructions

### Features
- **Document Operations**: Create, update, delete, list, place signatures
- **Template Operations**: List, create, update, delete templates
- **Signer Operations**: Add, update, delete signers with validation
- **Background Checks**: Person and company checks with Brazilian format validation
- **Webhook Management**: Create, delete, configure webhooks
- **Timestamp Services**: Add timestamps to documents

### Technical Details
- Node.js 18+ with ES modules
- Built-in support for Brazilian document formats (CPF, CNPJ)
- Comprehensive error handling and logging
- Ready for production deployment
- Full MCP protocol compliance

### Dependencies
- @modelcontextprotocol/sdk: ^1.9.0
- axios: ^1.6.0
- dotenv: ^16.4.7
- express: ^5.1.0
- winston: ^3.11.0
- zod: ^3.22.4

## [Unreleased]

### Planned
- Enhanced template form management
- Additional webhook event types
- Performance optimizations
- Extended documentation with more examples
