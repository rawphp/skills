# Release-safe checklists (on demand)

Load when the change set touches these stacks. Keep findings in the main skill output format.

## PHP / Composer library

- [ ] `composer.json` name, require, suggest, autoload PSR roots  
- [ ] Public namespace: removed classes, interfaces, final constructors  
- [ ] Service provider bindings / container abstracts hosts resolve  
- [ ] Config publish keys and defaults  
- [ ] Migrations: new file vs edit of already-released migration  
- [ ] Facades, contracts, DTOs, error codes  
- [ ] HTTP route table + status codes + JSON keys  
- [ ] Queue jobs: `handle` signature, `$tries`, `$timeout`, payload  
- [ ] CHANGELOG Keep a Changelog + 0.x honesty  
- [ ] Peer packages (`laravel/ai`, `laravel/mcp`) version constraints  

## HTTP / JSON API

- [ ] Path/method stability  
- [ ] Request required fields  
- [ ] Response success shape  
- [ ] Error envelope (`code`, `message`, `retryable`, http status)  
- [ ] Auth headers / cookies / tokens  
- [ ] Pagination / cursor semantics  
- [ ] Idempotency-Key behavior  
- [ ] Stub endpoints that became real (404/409 vs always-200)  

## Go CLI / binary

- [ ] Subcommand names and flags  
- [ ] Exit codes  
- [ ] JSON vs text stdout for scripts  
- [ ] Config file paths and env vars  
- [ ] Module path / go.mod version  
- [ ] Release artifacts / signing claims vs reality  

## Node / npm package

- [ ] `exports` map / main / types entrypoints  
- [ ] TypeScript public types  
- [ ] peerDependencies bumps  
- [ ] ESM/CJS dual package hazard  

## Database

- [ ] Expand/contract (add nullable → backfill → enforce)  
- [ ] Down migrations  
- [ ] Enum/status string sets  
- [ ] Unique constraints on dirty data  
- [ ] Multi-tenant scope columns  

## Monorepo package split

- [ ] Each publishable package reviewed on **library** bar  
- [ ] Cross-package contract (core → messaging/ai) versioned together  
- [ ] In-package docs only (no broken relative links after split)  
- [ ] Tag naming matches versioning.md / package remotes  

## Project (app) only — still check

- [ ] Secrets not in tree  
- [ ] Destructive migration plan  
- [ ] Env example updated  
- [ ] Deploy/rollback path  
- [ ] External webhooks you don't own (if any) — treat those like library wire  
