# Privacy Policy — ZapSign MCP Connector

**Effective Date:** [INSERT DATE]
**Last Updated:** [INSERT DATE]
**Version:** 1.0

---

## 1. Introduction

This Privacy Policy describes how [COMPANY LEGAL NAME] ("ZapSign", "we", "us", or "our") collects, uses, stores, and protects information when you use the ZapSign MCP Connector ("Connector", "Service").

The Connector is a **pass-through integration proxy** that enables Claude AI (by Anthropic) to interact with ZapSign's electronic signature API on your behalf via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). The Connector does not process, store, or have independent access to your documents, signatures, or signer information — it relays requests between Claude and ZapSign's API in real time.

This policy applies specifically to the Connector. For broader data practices, please also review:

- **ZapSign Privacy Policy:** [https://zapsign.com.br/politica-de-privacidade](https://zapsign.com.br/politica-de-privacidade)
- **Anthropic Privacy Policy:** [https://www.anthropic.com/privacy](https://www.anthropic.com/privacy)
- **Cloudflare Privacy Policy:** [https://www.cloudflare.com/privacypolicy/](https://www.cloudflare.com/privacypolicy/)

---

## 2. Scope

**This policy covers:**

- The authorization flow when you connect the Connector to Claude
- Data processed by the Connector's infrastructure (Cloudflare Workers)
- Security measures implemented in the Connector
- Optional marketing analytics on public documentation pages (`/docs` and the browser landing page for `/mcp`) after you give consent

**This policy does NOT cover:**

- How ZapSign processes your documents, signatures, or account data (see ZapSign's Privacy Policy)
- How Anthropic processes your conversations with Claude (see Anthropic's Privacy Policy)
- How Cloudflare operates its global network infrastructure (see Cloudflare's Privacy Policy)

---

<!-- LEGAL REVIEW: Confirm controller/processor designations with legal counsel. The designations below reflect the technical architecture but may need adjustment based on applicable law and contractual arrangements. -->

## 3. Data Controller and Processor Roles

Under the Brazilian General Data Protection Law (LGPD, Lei 13.709/2018) and the EU General Data Protection Regulation (GDPR), the parties involved in this Service have the following roles:

| Party | Role | Responsibility |
|-------|------|----------------|
| **[COMPANY LEGAL NAME]** (ZapSign) | Data Controller | Determines the purposes and means of processing through the Connector |
| **Cloudflare, Inc.** | Data Processor | Provides infrastructure (Workers, KV storage) on which the Connector runs |
| **Anthropic, PBC** | Independent Controller | Processes conversations independently under its own privacy policy |
| **You** (the user) | Data Subject / Controller | Controls which data is sent to ZapSign's API through Claude |

<!-- LEGAL REVIEW: Verify whether Anthropic should be designated as an independent controller or joint controller in the context of MCP tool invocations. -->

---

## 4. Data We Collect

The Connector collects the minimum data necessary to authenticate and relay requests. The following table describes each data element:

### 4.1 ZapSign API Token

| Attribute | Detail |
|-----------|--------|
| **What** | Your ZapSign API token, copied from your [ZapSign Dashboard > Integrations](https://app.zapsign.com.br/conta/integracoes) page |
| **Why** | To authenticate API requests to ZapSign on your behalf |
| **Storage** | Encrypted in Cloudflare Workers KV, bound to your OAuth session |
| **Retention** | Until OAuth grant expires (30 days) or you disconnect |
| **Legal Basis (LGPD)** | Art. 7, V — Performance of a contract |
| **Legal Basis (GDPR)** | Art. 6(1)(b) — Performance of a contract |

### 4.2 Anonymous Session Identifier

| Attribute | Detail |
|-----------|--------|
| **What** | A SHA-256 hash of the first 8 bytes of your API token |
| **Why** | To identify your session without exposing your credentials |
| **Storage** | Derived at runtime; stored as part of OAuth metadata |
| **Retention** | Same as OAuth grant (30 days) |
| **Legal Basis (LGPD)** | Art. 7, IX — Legitimate interest |
| **Legal Basis (GDPR)** | Art. 6(1)(f) — Legitimate interest |

### 4.3 OAuth Session Metadata

| Attribute | Detail |
|-----------|--------|
| **What** | Standard OAuth 2.1 grant data: client ID, granted scopes, token expiry timestamps |
| **Why** | To manage the authorization lifecycle and enforce scope-based access control |
| **Storage** | Cloudflare Workers KV, managed by [Cloudflare OAuthProvider](https://github.com/cloudflare/workers-oauth-provider) |
| **Retention** | Access token: 1 hour. Refresh token: 30 days |
| **Legal Basis (LGPD)** | Art. 7, V — Performance of a contract |
| **Legal Basis (GDPR)** | Art. 6(1)(b) — Performance of a contract |

### 4.4 CSRF Tokens

| Attribute | Detail |
|-----------|--------|
| **What** | Short-lived random tokens generated during the authorization flow |
| **Why** | To prevent cross-site request forgery attacks during authorization |
| **Storage** | Cloudflare Workers KV with automatic expiration |
| **Retention** | 5 minutes (single-use; deleted immediately after validation) |
| **Legal Basis (LGPD)** | Art. 7, IX — Legitimate interest (security) |
| **Legal Basis (GDPR)** | Art. 6(1)(f) — Legitimate interest (security) |

<!-- LEGAL REVIEW: Confirm that "legitimate interest" is the appropriate legal basis for session identifiers and CSRF tokens. A Legitimate Interest Assessment (LIA) may be required under GDPR. -->

---

## 5. Data We Do NOT Collect

The Connector explicitly does **not** collect, store, cache, or log:

- **Documents** — PDFs, document content, file attachments, or signed files
- **Signer personal data** — Names, email addresses, phone numbers, CPF/ID numbers, selfie photos, or geolocation
- **Template content** — Template definitions, field values, or pre-fill data
- **Signatures** — Electronic signatures, signature images, or signing certificates
- **User credentials** — ZapSign account passwords or email addresses
- **Conversation content** — What you say to Claude or what Claude responds
- **Analytics or tracking data on authorization pages** — The OAuth `/authorize` flow does not load cookies, fingerprinting, pixel trackers, session replay, or behavioral analytics scripts
- **API request/response bodies** — Document content and signer data pass through in transit but are never written to storage or logs

### 4.5 Marketing Analytics (Documentation Pages Only)

Public marketing pages (`/docs` and the human-readable `/mcp` browser landing) may load **Google Analytics 4** and **Microsoft Clarity** only after you accept a consent banner. Until you accept, Consent Mode defaults keep analytics storage denied and Clarity is not loaded. Rejecting consent keeps analytics off. Authorization pages never include these scripts.

| Attribute | Detail |
|-----------|--------|
| **What** | Aggregated page analytics (GA4) and masked session insights (Clarity) on marketing HTML only |
| **Why** | Improve documentation and connector onboarding experiences |
| **Storage** | Browser storage for your consent choice; vendor cookies/identifiers only after accept |
| **Retention** | Per Google Analytics and Microsoft Clarity retention settings |
| **Legal Basis (LGPD)** | Art. 7, I — Consent |
| **Legal Basis (GDPR)** | Art. 6(1)(a) — Consent |

---

## 6. How Data Flows

### 6.1 Connection Flow (One-Time Authorization)

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────────┐
│  Claude   │────>│  Connector    │────>│  ZapSign     │     │  Cloudflare │
│  Desktop  │     │  (Worker)     │     │  API         │     │  KV         │
│           │     │               │     │              │     │             │
│ 1. User   │     │ 2. Shows      │     │ 4. Validates │     │ 5. Stores   │
│    clicks │     │    auth form  │     │    token     │     │    encrypted│
│    Connect│     │ 3. User       │     │    (Bearer)  │     │    token +  │
│           │     │    pastes     │     │              │     │    OAuth    │
│           │     │    API token  │     │              │     │    metadata │
└──────────┘     └───────────────┘     └──────────────┘     └─────────────┘
```

**Security during connection:**
- PKCE (Proof Key for Code Exchange) enforced — plain PKCE disallowed
- CSRF token validated (single-use, 5-minute TTL)
- HMAC-SHA256 signature validates form integrity
- API token validated against ZapSign before OAuth grant is issued

### 6.2 Tool Usage Flow (Each Interaction)

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Claude   │────>│  Connector    │────>│  ZapSign     │
│           │     │  (Worker)     │     │  API         │
│ 1. User   │     │ 2. Validates  │     │              │
│    asks   │     │    OAuth +    │     │ 4. Processes │
│    Claude │     │    scopes     │     │    request   │
│    to act │     │ 3. Forwards   │     │ 5. Returns   │
│           │<────│    request    │<────│    response  │
│ 7. Claude │     │ 6. Relays     │     │              │
│    shows  │     │    response   │     │              │
│    result │     │    (no store) │     │              │
└──────────┘     └───────────────┘     └──────────────┘
```

**At no point does the Connector store, log, or cache the request body or response body.** Data passes through the Worker's memory only for the duration of the HTTP request and is discarded when the request completes.

---

<!-- LEGAL REVIEW: Confirm that the legal bases mapped below are appropriate for each purpose. Consider whether a Data Protection Impact Assessment (DPIA) is required given the AI integration context. -->

## 7. Purpose and Legal Basis

| Purpose | Data Used | LGPD Art. 7 Basis | GDPR Art. 6(1) Basis |
|---------|-----------|--------------------|-----------------------|
| Authenticate API requests to ZapSign | API token | (V) Contract performance | (b) Contract performance |
| Manage OAuth session lifecycle | OAuth metadata, session ID | (V) Contract performance | (b) Contract performance |
| Enforce scope-based access control | Granted scopes | (V) Contract performance | (b) Contract performance |
| Prevent CSRF attacks during authorization | CSRF tokens | (IX) Legitimate interest | (f) Legitimate interest |
| Identify sessions without exposing credentials | Session ID (hash) | (IX) Legitimate interest | (f) Legitimate interest |
| Relay requests between Claude and ZapSign | In-transit data (not stored) | (V) Contract performance | (b) Contract performance |
| Improve marketing documentation (after consent) | GA4 / Clarity events on `/docs` and `/mcp` landing | (I) Consent | (a) Consent |

---

## 8. Data Storage and Security

### 8.1 Infrastructure

The Connector runs entirely on **Cloudflare Workers**, a serverless platform with:

- **SOC 2 Type II** certification
- **ISO 27001** certification
- **PCI DSS** Level 1 compliance
- Global edge network with encryption in transit (TLS 1.3)

All persistent data is stored in **Cloudflare Workers KV**, an encrypted key-value store distributed across Cloudflare's global network.

### 8.2 Application Security Measures

| Measure | Implementation |
|---------|----------------|
| **OAuth 2.1 with PKCE** | Authorization Code flow with S256 code challenge; plain PKCE explicitly disabled |
| **CSRF Protection** | UUID tokens with 5-minute TTL, single-use validation, stored in KV |
| **HMAC-SHA256 Integrity** | Form submissions signed with HMAC to prevent parameter tampering |
| **Content Security Policy (authorize)** | `script-src 'none'` — no JavaScript execution on authorization or security error pages |
| **Content Security Policy (marketing)** | Allows Google Tag Manager / Analytics and Microsoft Clarity only on `/docs` and the `/mcp` browser landing |
| **Clickjacking Protection** | `X-Frame-Options: DENY` on all responses |
| **MIME Sniffing Prevention** | `X-Content-Type-Options: nosniff` on all responses |
| **Per-Request Isolation** | New MCP server instance created per request (mitigates CVE GHSA-345p-7cg4-v4c7) |
| **Scope Enforcement** | Every tool validates required OAuth scopes before executing |
| **Token Hashing** | API tokens hashed (SHA-256) for session identification; raw tokens never logged |
| **Response Size Limits** | Responses capped at ~80,000 characters to prevent memory exhaustion |
| **Rate Limit Handling** | Automatic backoff on ZapSign 429 responses; retry limited to safe (GET) operations |

### 8.3 What We Do NOT Do

- We do **not** log API tokens, request bodies, or response bodies
- We do **not** run analytics, cookies, or session replay on authorization pages
- We do **not** execute client-side JavaScript on authorization pages
- We do **not** load GA4 or Clarity until you accept consent on marketing pages
- We do **not** cache or persist ZapSign API responses

---

## 9. Data Retention and Deletion

| Data Element | Retention Period | Deletion Mechanism |
|-------------|------------------|--------------------|
| ZapSign API Token | 30 days (OAuth refresh token TTL) | Automatic KV expiration; immediate on disconnect |
| OAuth Session Metadata | Access: 1 hour. Refresh: 30 days | Automatic KV expiration |
| Session Identifier (hash) | 30 days (bound to OAuth grant) | Deleted with OAuth grant |
| CSRF Tokens | 5 minutes | Automatic KV expiration; consumed on first use |
| In-transit request/response data | Duration of HTTP request only | Discarded when request completes (Worker memory) |

### 9.1 How to Delete Your Data

**Disconnect the Connector:**
1. Open **Claude Settings > Connectors**
2. Find "ZapSign MCP Connector"
3. Click **Disconnect**

Disconnecting revokes the OAuth grant and triggers deletion of all associated tokens and metadata from Cloudflare KV.

**Rotate your API token:**
1. Go to your [ZapSign Dashboard > Integrations](https://app.zapsign.com.br/conta/integracoes)
2. Regenerate your API token

This immediately invalidates the token stored by the Connector. The Connector will stop functioning until you reconnect with a new token.

---

## 10. Third-Party Services

The Connector relies on the following third-party services:

| Service | Role | Data Shared | Privacy Policy |
|---------|------|-------------|----------------|
| **ZapSign** (zapsign.com.br) | Electronic signature platform | API requests made on your behalf using your token | [Privacy Policy](https://zapsign.com.br/politica-de-privacidade) |
| **Cloudflare** (cloudflare.com) | Infrastructure provider | Encrypted tokens and OAuth metadata stored in KV | [Privacy Policy](https://www.cloudflare.com/privacypolicy/) |
| **Anthropic** (anthropic.com) | AI platform (Claude) | Conversation context including tool results | [Privacy Policy](https://www.anthropic.com/privacy) |
| **Google Analytics 4** (marketing pages only, after consent) | Product analytics for `/docs` and `/mcp` landing | Page views and related engagement events | [Google Privacy Policy](https://policies.google.com/privacy) |
| **Microsoft Clarity** (marketing pages only, after consent) | Masked session insights for documentation UX | Interaction data with sensitive input masking enabled | [Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement) |

**We do not sell, rent, or share your data with any other third parties.** Connector auth data is shared only as needed to provide the Connector. Marketing analytics vendors receive data only from consented marketing pages, never from `/authorize`.

---

## 11. Your Rights

### 11.1 Rights Under LGPD (Brazilian Data Subjects)

Under the Brazilian General Data Protection Law (Lei 13.709/2018), you have the following rights:

| Right | LGPD Article | How to Exercise |
|-------|-------------|-----------------|
| Confirmation of processing | Art. 18, I | Contact our DPO (see Section 15) |
| Access to your data | Art. 18, II | Contact our DPO |
| Correction of incomplete or inaccurate data | Art. 18, III | Update your token in ZapSign Dashboard |
| Anonymization, blocking, or deletion of unnecessary data | Art. 18, IV | Disconnect the Connector (see Section 9.1) |
| Data portability | Art. 18, V | Contact our DPO |
| Deletion of data processed with consent | Art. 18, VI | Disconnect the Connector |
| Information about shared data | Art. 18, VII | See Section 10 of this policy |
| Information about consent denial consequences | Art. 18, VIII | Service will not function without API token |
| Revocation of consent | Art. 18, IX | Disconnect the Connector or rotate your API token |
| Opposition to processing | Art. 17 | Contact our DPO |
| Review of automated decisions | Art. 20 | Contact our DPO |

**Response time:** Within 15 days of receiving your request, in accordance with LGPD Art. 18, § 5.

You may also file a complaint with the Brazilian National Data Protection Authority (ANPD) at [https://www.gov.br/anpd](https://www.gov.br/anpd).

### 11.2 Rights Under GDPR (EEA/UK Data Subjects)

Under the General Data Protection Regulation, you have the following rights:

| Right | GDPR Article | How to Exercise |
|-------|-------------|-----------------|
| Right of access | Art. 15 | Contact our DPO (see Section 15) |
| Right to rectification | Art. 16 | Update your token in ZapSign Dashboard |
| Right to erasure ("right to be forgotten") | Art. 17 | Disconnect the Connector (see Section 9.1) |
| Right to restriction of processing | Art. 18 | Contact our DPO |
| Right to data portability | Art. 20 | Contact our DPO |
| Right to object | Art. 21 | Contact our DPO |
| Right not to be subject to automated decisions | Art. 22 | Contact our DPO |

**Response time:** Within 30 days of receiving your request, in accordance with GDPR Art. 12(3).

You may also lodge a complaint with a supervisory authority in your member state under GDPR Art. 77.

### 11.3 Practical Steps You Can Take at Any Time

- **Disconnect** the Connector via Claude Settings > Connectors (removes all stored data)
- **Rotate** your ZapSign API token (immediately invalidates stored credentials)
- **Review scopes** during authorization (grant only the permissions you need)
- **Reconnect** with narrower scopes at any time (revoke and re-authorize with fewer permissions)

---

<!-- LEGAL REVIEW: Confirm international transfer mechanisms. Cloudflare's global edge network means data may be processed in multiple jurisdictions. Verify that Cloudflare's DPA and SCCs cover all required scenarios. -->

## 12. International Data Transfers

### 12.1 Where Data Is Processed

The Connector runs on Cloudflare's global edge network. Requests are processed at the Cloudflare data center nearest to you, and KV data is distributed globally across Cloudflare's infrastructure.

### 12.2 Transfers from Brazil

International transfers of personal data from Brazil are conducted in compliance with LGPD Art. 33, relying on:

- Cloudflare's standard contractual clauses and data processing addendum
- Transfer to countries or international organizations that provide an adequate level of data protection, as determined by the ANPD

### 12.3 Transfers from the EEA/UK

For transfers of personal data from the European Economic Area or United Kingdom, we rely on:

- **Standard Contractual Clauses (SCCs)** approved by the European Commission
- Cloudflare's adherence to the EU-U.S. Data Privacy Framework

<!-- LEGAL REVIEW: Confirm that Cloudflare's current DPA and SCCs are sufficient. Consider whether a Transfer Impact Assessment (TIA) is required. Verify EU representative appointment under GDPR Art. 27 if applicable. -->

---

## 13. Children's Privacy

The Connector is not directed at individuals under the age of 18. Use of the Connector requires:

1. A ZapSign account (which requires being of legal age to enter contracts)
2. A Claude account (subject to Anthropic's age requirements)

We do not knowingly collect personal data from children. If you believe a child has provided personal data through the Connector, please contact us at the address in Section 15 and we will promptly delete such data.

---

## 14. AI-Specific Transparency

### 14.1 What AI Can Access

When you use the Connector through Claude, the AI assistant can:

- **List** your documents, signers, and templates (with `read` scopes)
- **Create** documents, add signers, and create documents from templates (with `write` scopes)
- **Update** document and signer properties (with `write` scopes)
- **Delete** documents and signers (with `write` scopes)

### 14.2 What AI Cannot Access

The Connector enforces strict scope-based access control:

- Claude can only perform actions within the scopes **you explicitly grant** during authorization
- Available scopes: `documents:read`, `documents:write`, `signers:read`, `signers:write`, `templates:read`, `templates:write`
- You choose which scopes to grant and can reconnect with different scopes at any time

### 14.3 Human Control

- **You initiate every action.** Claude only calls ZapSign tools when you ask it to.
- **You control permissions.** The authorization page shows exactly what scopes are being requested.
- **You can disconnect at any time.** Revoking access is immediate and permanent until you reconnect.
- **Destructive actions require confirmation.** Delete operations are annotated as destructive, prompting Claude to confirm before proceeding.

### 14.4 AI Training

- **The Connector does not use your data for AI training.** The Connector is a relay — it does not have its own AI model or learning capability.
- For information about how Anthropic uses conversation data, see [Anthropic's Privacy Policy](https://www.anthropic.com/privacy).
- For information about how ZapSign uses your account data, see [ZapSign's Privacy Policy](https://zapsign.com.br/politica-de-privacidade).

---

<!-- LEGAL REVIEW: Confirm DPO appointment details. Under LGPD Art. 41, a DPO (Encarregado) must be appointed. Under GDPR Art. 37, determine if DPO appointment is mandatory based on processing activities. -->

## 15. Contact Information

For privacy inquiries, data subject requests, or questions about this policy:

**Data Protection Officer (Encarregado):**
[DPO NAME]
[DPO EMAIL]

**General Privacy Contact:**
[COMPANY LEGAL NAME]
[INSERT ADDRESS]
Email: privacy@zapsign.com.br

**ZapSign Support:**
support@zapsign.com.br

**Related contacts:**
- Anthropic privacy inquiries: [https://www.anthropic.com/privacy](https://www.anthropic.com/privacy)
- Cloudflare privacy inquiries: [https://www.cloudflare.com/privacypolicy/](https://www.cloudflare.com/privacypolicy/)

---

## 16. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements.

**Material changes** (changes to data collection, new third parties, changes to retention periods, or changes to your rights) will be communicated through:

- A notice in the Connector's authorization page
- An update to the "Last Updated" date at the top of this policy

**Non-material changes** (clarifications, formatting, grammar) will be reflected in the version history with an updated date.

The full version history of this policy is available in our [GitHub repository](https://github.com/fabricioism/zapsign-mcp/blob/main/docs/PRIVACY_POLICY_WEB.md).

---

## 17. Governing Law

This Privacy Policy is governed by the laws of the Federative Republic of Brazil, in particular the General Data Protection Law (LGPD, Lei 13.709/2018).

For data subjects in the European Economic Area, this policy is additionally subject to the General Data Protection Regulation (GDPR). In case of conflict between this policy and the GDPR for EEA data subjects, the GDPR shall prevail. EEA data subjects retain the right to lodge complaints with their local supervisory authority and to seek judicial remedy in their member state in accordance with GDPR Art. 79.

---

## Appendix A: Data Summary Table

| Data Element | Collected | Stored | Retention | Shared With | Legal Basis (LGPD / GDPR) |
|-------------|-----------|--------|-----------|-------------|----------------------------|
| ZapSign API Token | Yes | Yes (encrypted KV) | 30 days | ZapSign (as Bearer auth) | Contract / Contract |
| Session ID (SHA-256 hash) | Yes (derived) | Yes (OAuth metadata) | 30 days | None | Legitimate interest |
| OAuth Metadata | Yes | Yes (KV) | Access: 1h, Refresh: 30d | None | Contract / Contract |
| CSRF Tokens | Yes | Yes (KV, transient) | 5 minutes | None | Legitimate interest |
| Documents & content | No | No | N/A | N/A | N/A |
| Signer PII | No | No | N/A | N/A | N/A |
| Template content | No | No | N/A | N/A | N/A |
| Signatures | No | No | N/A | N/A | N/A |
| Conversation content | No | No | N/A | N/A | N/A |
| Cookies / Analytics on `/authorize` | No | No | N/A | N/A | N/A |
| GA4 / Clarity on marketing pages | Only after consent | Vendor + local consent flag | Per vendor + until cleared | Google / Microsoft | Consent / Consent |

---

*This privacy policy was prepared for the ZapSign MCP Connector. For questions, contact privacy@zapsign.com.br.*
