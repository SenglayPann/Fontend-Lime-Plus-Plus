---
name: V3 Loophole Inspection
about: Track implementation of the V3 loophole inspection plan.
title: "V3 loophole inspection implementation"
labels: security, hardening
assignees: ""
---

## Phase Checklist

- [ ] Phase 0 - Baseline and guardrails
- [ ] Phase 1 - Stop sensitive data leaks
- [ ] Phase 2 - Fix auth token transport and session refresh
- [ ] Phase 3 - Harden webhooks and project lock immutability
- [ ] Phase 4 - Tighten role delegation and scope rules
- [ ] Phase 5 - Validation and data model corrections
- [ ] Phase 6 - GitHub sync correctness
- [ ] Phase 7 - Frontend authorization and UX reliability
- [ ] Phase 8 - Reports, exports, and operational hardening
- [ ] Phase 9 - Dependency remediation

## Frontend Focus

- [ ] Remove URL query token parsing from OAuth callback flow.
- [ ] Refresh roles and scopes after access-token refresh.
- [ ] Reject sessions with token refresh errors in middleware.
- [ ] Disable authenticated server fetch caching where bearer tokens are used.
- [ ] Preserve backend errors instead of rendering them as empty states.
- [ ] Remediate frontend dependency advisories or document accepted exceptions.
