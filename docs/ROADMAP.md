# Roadmap — Pendências Não-Bloqueantes

Itens identificados durante o Checkpoint Alpha que não impedem o primeiro push,
mas devem ser resolvidos antes de ir para produção.

---

## Segurança

- [ ] Rate-limiter: adicionar cabeçalhos `Retry-After` e `X-RateLimit-*` nas respostas 429
- [ ] Origin/Referer validation: tornar obrigatório em produção (hoje é opcional)
- [ ] `secure: true` no cookie: já condicionado a `NODE_ENV=production`, validar em staging
- [ ] Avaliar `SameSite=strict` vs `lax` para o cookie de sessão
- [ ] Implementar CSRF pós-login para mutações autenticadas (usar `csrfSecret` da sessão)

## Sessões

- [ ] Renovação do `idleTimeout` no `getSession` já implementada; validar com testes automatizados
- [ ] Adicionar endpoint `GET /auth/sessions` para listar sessões ativas do usuário
- [ ] Implementar `DELETE /auth/sessions/:id` para revogar sessão individual

## Banco de Dados

- [ ] Seed: usar `hashPassword()` do `@repo/security` em vez de hash hardcoded
- [ ] Adicionar índice composto em `User(emailNormalized, organizationId)` se multi-tenant
- [ ] Avaliar conexão pooling (PgBouncer) para produção

## Frontend (Next.js)

- [ ] Layout protegido: encaminhar cookie explicitamente no fetch server-side
- [ ] Implementar página de login funcional conectada ao fluxo CSRF → login
- [ ] Adicionar tratamento de erros global (toast/snackbar)
- [ ] Adicionar loading states nos componentes de dashboard

## Testes

- [ ] Testes de integração automatizados (substituir `test-real.ts` por suite Vitest/Jest)
- [ ] Testes unitários para `AuthService.validateCredentials`
- [ ] Testes unitários para `RedisRateLimiterService`
- [ ] Testes E2E com Playwright para o fluxo de login completo

## DevOps / CI

- [ ] GitHub Actions: lint + typecheck + test + build
- [ ] Docker multi-stage build para a API (produção)
- [ ] Configurar `.env.production` com secrets manager (ex: Vault, AWS SSM)

## Marco 4 — Meta WhatsApp API

- [ ] Implementar módulo de integração com a Meta Graph API
- [ ] Webhook receiver para eventos de mensagem
- [ ] Provider pattern: mock ↔ real (já estruturado via env)
