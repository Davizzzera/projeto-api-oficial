# Nexus WhatsApp SaaS - Current State

## Objetivo do Produto
Plataforma SaaS multi-tenant para gerenciamento de atendimento via WhatsApp, permitindo que organizações gerenciem conexões, atendentes e mensagens de forma centralizada e escalável.

## Stack
- Monorepo: pnpm / TurboRepo
- Backend: NestJS 10, Fastify, PostgreSQL 16, Prisma 7, Redis 7
- Frontend: Next.js 16, React 19, TypeScript
- Testes: Vitest, Playwright, Docker (integração)

## Marcos Concluídos
- **Marco 1**: Setup Base (Monorepo, CI/CD, Prisma, NestJS, Next.js).
- **Marco 2**: Autenticação (JWT, Cookies seguros, Redis sessions, CSRF, Password hashing).
- **Marco 3 & 3.5**: Multi-Tenancy e Autorização (Organizações, Memberships, RBAC básico, Rotação atômica de sessão, Auditoria, Security Events, Organization Switcher UI).

## Endpoints Implementados (Principais)
- `GET /auth/csrf` - Obtenção de token CSRF
- `POST /auth/login` - Login e criação de sessão (Pre-auth -> Auth)
- `POST /auth/logout` - Revogação de sessão
- `GET /auth/me` - Retorna dados do usuário e organização atual
- `POST /auth/switch-organization` - Troca de organização com rotação atômica de sessão

## Arquitetura de Autenticação e Multi-Tenancy
A autenticação utiliza JWT armazenado em cookies `HttpOnly`, com sessões controladas via Redis para revogação instantânea e controle de concorrência. 
O Multi-tenancy é baseado em isolamento lógico via `organizationId`. Cada usuário possui um `Membership` que define seu `Role` (ex: ADMIN, MEMBER) dentro da organização.
O middleware de Tenant injeta o contexto da organização nas rotas autenticadas, limitando o escopo de leitura e escrita.

## Estado Atual da Main
A branch `main` encontra-se estabilizada com toda a infraestrutura base e autorização RBAC Multi-tenant concluídas. O fechamento técnico do Marco 3.5 garantiu que operações críticas como troca de organização ocorram com segurança e consistência atômica. A CI pipeline exige lint, types, testes unitários e testes de integração com banco/redis reais passando.

## Próximo Marco
**Marco 4A: Connections MOCK-first**
- Iniciar o domínio de conexões de WhatsApp de forma mockada (simulando a Evolution API).
- CRUD de Conexões por Organização.
- Interface para conectar/desconectar.

## Comandos Oficiais de Validação
- `pnpm lint` - Verificação de código
- `pnpm typecheck` - Checagem de tipos do TypeScript
- `pnpm test` - Testes unitários (Vitest)
- `pnpm test:integration:local` - Testes de integração usando Docker Compose local (cria containers, roda testes, e derruba).
- `pnpm build` - Build de todos os apps/packages
- `pnpm test:integration` - Testes de integração diretos (usado no CI, requer serviços ativos).

## Regras de Segurança Essenciais
- Nunca inclua secrets/chaves reais no código. Use apenas variáveis de ambiente dummy para teste.
- Rotação atômica de sessões ao trocar de organização (com script Lua no Redis).
- Validação CSRF em toda requisição mutável autenticada.
- O contexto de tenant (`organizationId`) nunca deve vir do body de uma request comum, e sim inferido pelo token de sessão.
- Falhas de concorrência e autorização devem ser negadas fail-safe (403/409).

## Links Internos
- [Arquitetura](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
