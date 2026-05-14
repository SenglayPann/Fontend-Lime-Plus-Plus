# V3 Loophole Inspection Phase 0 Baseline

Date: 2026-05-14

Scope: frontend workspace.

## Baseline Commands

| Command | Result |
| --- | --- |
| `npm test` | Passed: 3 suites, 8 tests |
| `npm run build` | Passed |
| `npm audit --audit-level=high` | Failed: 7 vulnerabilities; 4 high, 3 moderate |

## Notes

- `npm run build` completed on Next.js 16.1.6 and warned that the `middleware` file convention is deprecated in favor of `proxy`.
- The audit result includes high-severity Next.js advisories. Dependency remediation remains Phase 9 work.

## Guardrail Tests Added

- Middleware authorization regression coverage for rejecting sessions with token refresh errors.
