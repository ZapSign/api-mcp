# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in the ZapSign MCP Server, please report it responsibly.

**Do not** file public GitHub issues, discussions, or pull requests for security vulnerabilities.

### How to Report

Send an email to **[security@zapsign.com.br](mailto:security@zapsign.com.br)** with the subject line: **"ZapSign MCP Server — Security Vulnerability"**

You can also report vulnerabilities through ZapSign's Trust Center:
https://app.vanta.com/zapsign.com.br/trust/2r7pzu657cx76es2ji28l

### What to Include

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (optional)

## Response Timeline

| Stage | Timeframe |
| ----- | --------- |
| Acknowledgment of report | Within 48 hours |
| Initial assessment and next steps | Within 7 days |
| Fix deployed (if confirmed) | Within 30 days |

We will keep you informed about the progress of addressing the vulnerability throughout the process.

## Scope

This policy covers the ZapSign MCP Server and its infrastructure:

- Cloudflare Worker runtime and KV storage (API tokens encrypted at rest)
- OAuth 2.1 authorization flow (DCR, PKCE S256, token exchange)
- HMAC-SHA256 integrity verification on OAuth request data
- MCP tool handlers and API client
- Authorization page and CSRF protection (KV-backed, 5-minute TTL)
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options)

**Out of scope**: ZapSign's main platform (zapsign.com.br), ZapSign's API (api.zapsign.com.br), and Cloudflare's infrastructure. For vulnerabilities in ZapSign's platform, contact ZapSign directly through their [Trust Center](https://app.vanta.com/zapsign.com.br/trust/2r7pzu657cx76es2ji28l).

## Disclosure Policy

We ask that you:

- Allow up to 90 days for us to address the issue before any public disclosure
- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Do not access or modify data that does not belong to you

We will not pursue legal action against researchers who follow this policy. If you wish to be credited for your discovery, we are happy to acknowledge your contribution in our release notes.

Security fixes are published as GitHub releases with a security advisory describing the issue and its resolution.

## Related Documentation

- [Privacy Policy](docs/PRIVACY_POLICY.md) — Data collection, storage, and user rights
- [Reviewer Guide](docs/REVIEWER_GUIDE.md) — Security architecture details
