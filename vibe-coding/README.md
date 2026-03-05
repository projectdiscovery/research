# Vibe Coding Security Benchmark

Three full-stack web applications built entirely with AI coding tools, used to benchmark security scanners on AI-generated code.

Read the full writeup: [Part 1](https://projectdiscovery.io/blog/ai-code-review-vs-neo) | Part 2 (coming soon)

## The apps

| Application | Domain | Stack | Built with | LOC |
|-------------|--------|-------|------------|----:|
| **MedPortal** | Healthcare | Next.js 14, Prisma, PostgreSQL, NextAuth.js | Codex (gpt-5-codex) | 4,528 |
| **VaultBank** | Banking | React 18, FastAPI, SQLAlchemy, JWT | Claude Code (Sonnet 4.6) | 10,470 |
| **ClaimFlow** | Insurance | SvelteKit, Drizzle ORM, SQLite, Custom Auth | Cursor | 12,368 |

Each app was generated using three sequential prompts (foundation, auth + RBAC, complex features) from a fresh session with no corrections. Each app has 5 roles with different permission levels.

**These apps were not prompted to be vulnerable.** They were built with normal product requirements the way engineering teams use AI coding tools today.

## Findings

We confirmed **70 exploitable vulnerabilities** across the three apps, including 6 Critical and 12 High severity issues. The full findings table is in [`FINDINGS.csv`](FINDINGS.csv).

### Scanner results

| Metric | Neo | Claude | Invicti | Snyk |
|--------|----:|-------:|--------:|-----:|
| Valid findings | **62** | 40 | 10 | 0 |
| False positives | **5** | 26 | 10 | 5 |
| Precision | **93%** | 61% | 50% | 0% |
| Critical+High | **18/18** | 12/18 | 0/18 | 0/18 |

### Severity breakdown

| Severity | ClaimFlow | VaultBank | MedPortal | Total |
|----------|:---------:|:---------:|:---------:|------:|
| Critical | 2 | 4 | 0 | **6** |
| High | 4 | 3 | 5 | **12** |
| Medium | 9 | 5 | 1 | **15** |
| Low | 5 | 13 | 7 | **25** |
| Info | 4 | 2 | 6 | **12** |
| **Total** | **24** | **27** | **19** | **70** |

## Repository structure

```
vaultbank/          # Digital banking platform (React 18 + FastAPI + PostgreSQL)
medportal/          # Healthcare patient portal (Next.js 14 + Prisma + PostgreSQL)
claimflow/          # Insurance claims management (SvelteKit + Drizzle ORM + SQLite)
FINDINGS.csv        # All 120 findings with ground truth classifications
```

## Contributing

The 70 confirmed vulnerabilities we found likely isn't the ceiling. We're publishing the apps and findings so the community can validate, challenge, and extend this benchmark. If you find something we missed, open an issue or PR.

If you maintain a security scanner and want to benchmark against the same codebase, this repo has everything you need: source code and the full findings table with ground truth classifications.

## License

MIT
