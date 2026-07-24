# Marco 3.5 — Autorização Multi-Tenant em Runtime, RBAC Efetivo e Troca de Organização

> **Data**: 2026-07-24
> **Status**: PLANEJAMENTO — Aprovado conceitualmente, com correções obrigatórias aplicadas
> **Autor**: Auditoria automatizada sobre o código real do repositório

---

## Índice

1. [Validação do Estado Atual](#1-validação-do-estado-atual)
2. [Auditoria do ARCHITECTURE.md](#2-auditoria-do-architecturemd)
3. [Revisão do Seed](#3-revisão-do-seed)
4. [Proposta de Arquitetura](#4-proposta-de-arquitetura)
5. [Testes Obrigatórios](#5-testes-obrigatórios)
6. [Escopo e Arquivos](#6-escopo-e-arquivos)
7. [Riscos](#7-riscos)
8. [Plano de Implementação](#8-plano-de-implementação)

---

## 1. Validação do Estado Atual

Cada item foi verificado **no código**, não apenas na documentação.

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 1 | **SessionGuard** | 🔴 AUSENTE | Nenhum arquivo contendo `CanActivate`, `@UseGuards`, ou `SessionGuard` encontrado em `apps/api/`. A validação de sessão é feita **inline** no `auth.controller.ts` (linhas 141–173 do `/auth/me`). Não existe guard reutilizável nem `SessionValidationService`. |
| 2 | **CurrentAuth decorator** | 🔴 AUSENTE | Nenhum `createParamDecorator` encontrado em `apps/api/`. Cada controller extrai sessão manualmente via `req.cookies`. |
| 3 | **TenantContext request-scoped** | 🔴 AUSENTE | Nenhuma referência a `Scope.REQUEST` ou `TenantContext` em `apps/api/`. O `organizationId` está na sessão Redis mas não é propagado como provider request-scoped. |
| 4 | **PermissionsGuard** | 🔴 AUSENTE | Nenhum guard de permissões encontrado. Não existe enforcement de `RolePermission` em runtime — nenhum endpoint verifica permissões. |
| 5 | **RequirePermissions decorator** | 🔴 AUSENTE | Nenhum decorator de metadados para permissões encontrado em todo o monorepo. |
| 6 | **Endpoint de troca de organização** | 🔴 AUSENTE | Não existe `POST /auth/switch-organization` nem rota similar. O `auth.controller.ts` expõe apenas `GET /csrf`, `POST /login`, `GET /me`, `POST /logout`. |
| 7 | **Listagem de organizações do usuário** | 🔴 AUSENTE | Não existe `GET /auth/organizations` nem rota similar. O login seleciona automaticamente a primeira membership ativa (`orderBy: { createdAt: 'asc' }, take: 1` em `auth.service.ts:48-49`). |
| 8 | **RolePermission mappings no seed** | 🔴 AUSENTE | O `seed.ts` cria 3 Roles e 4 Permissions mas **não cria nenhum `RolePermission`**. Não há `prisma.rolePermission.upsert()` ou `create()` no seed. A tabela `role_permissions` ficará vazia. |
| 9 | **Testes cross-tenant** | 🔴 AUSENTE | Nenhum teste verifica isolamento cross-tenant em endpoints de dados (a serem cobertos no Marco 4A). Atualmente só há verificação de que a **sessão adulterada** é invalidada em `auth.e2e.spec.ts:350`. |
| 10 | **Testes de IDOR** | 🔴 AUSENTE | Nenhum teste de substituição de ID na URL. Cobertura completa de IDOR será no Marco 4A (Connections), enquanto o 3.5 focará em isolamento de contexto de autenticação. |
| 11 | **Testes de permissions** | 🔴 AUSENTE | Sem guard de permissões, não há testes de 403 por falta de permissão. |
| 12 | **Proteção CSRF para troca de organização** | 🔴 AUSENTE | O endpoint não existe, portanto a proteção também não. O CSRF HMAC autenticado existe mas é hardcoded para `action: 'auth:logout'`. |

### Componentes Parcialmente Implementados

| Item | Observação |
|------|------------|
| **Sessão com organizationId** | ✅ A sessão Redis já armazena `userId`, `membershipId`, `organizationId`, `sessionVersion`, `csrfSecret`. Schema: `redis-session.schema.ts`. |
| **Validação de sessão no /auth/me** | ✅ Verifica `sessionVersion`, user ativo, org ativa, membership ativa. Mas é inline, não centralizada em um service/guard. |
| **CSRF HMAC autenticado** | ✅ Implementado em `auth.service.ts:201-217`. Mas o action é fixo (`auth:logout`) e precisa de schema enumerado (allowlist). |
| **Repositories** | ✅ `MembershipRepository` já carrega `role.rolePermissions.permission`. Pronto para o PermissionsGuard. |
| **OrganizationSwitcher (frontend)** | 🟡 PARCIAL — Existe `organization-switcher.tsx` mas é **apenas visual**: mostra o nome da org ativa, botão não funcional (sem dropdown, sem listagem, sem chamada API). |

---

## 2. Auditoria do ARCHITECTURE.md

*(As verificações feitas identificaram falta de enforcement RBAC, seed de RolePermission ausente e OrganizationSwitcher puramente visual. O ARCHITECTURE.md deverá ser atualizado para refletir o estado real e o plano do Marco 3.5 conforme descrito no [tópico 8](#8-plano-de-implementação)).*

---

## 3. Revisão do Seed

### Recomendação para RolePermission no seed:

O seed deve criar os relacionamentos entre Role e Permission para que o RBAC funcione na prática.
```typescript
// Após criar roles e permissions, criar mappings
const rolePermissionMappings: Record<string, string[]> = {
  ADMIN:  ['org:read', 'org:write', 'members:read', 'members:write'],
  MEMBER: ['org:read', 'members:read'],
  VIEWER: ['org:read'],
};

for (const [roleCode, permKeys] of Object.entries(rolePermissionMappings)) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) continue;

  for (const permKey of permKeys) {
    const perm = await prisma.permission.findUnique({ where: { key: permKey } });
    if (!perm) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
  }
}
```

---

## 4. Proposta de Arquitetura

### 4.1 Separação de Sessão e Contexto Autenticado

É fundamental não expor informações confidenciais (como `csrfSecret`) no request público dos controllers.

1. **`StoredSession`**: A estrutura interna persistida no Redis.
   - Contém: `userId`, `membershipId`, `organizationId`, `sessionVersion`, `csrfSecret`, `createdAt`, `lastActivityAt`, `absoluteExpiresAt`.
   - **NUNCA** deve ser anexada integralmente ao request.
2. **`AuthPrincipal`**: A estrutura segura e limpa injetada nos controllers.
   - Contém: `userId`, `membershipId`, `organizationId`, `sessionVersion`, `roleCode`, `permissions`, `platformRole`.
   - **NÃO** contém: `csrfSecret`, `cookie`, `token` ou `sessionId`.

### 4.2 Tipagem do Fastify

Será adicionada tipagem nativa para injetar de forma segura no request via _declaration merging_.
**Arquivo**: `apps/api/src/common/types/fastify.d.ts`
```typescript
import 'fastify';
import { AuthPrincipal } from './auth-principal';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthPrincipal;
    sessionId?: string; // Internal session ID (se necessário pelo SessionValidationService ou logout)
  }
}
```

### 4.3 SessionValidationService e SessionGuard

Não se deve concentrar a lógica inteira no `SessionGuard`.

**`SessionValidationService`**:
- Desassina o cookie.
- Busca `StoredSession` no Redis e valida expiração.
- Valida status do user, membership e org no banco.
- Carrega role e permissions.
- Renova idle timeout ou invalida sessão.
- Retorna `AuthPrincipal` e `sessionId` interno.

**`SessionGuard`**:
- Apenas chama o `SessionValidationService`.
- Associa o `AuthPrincipal` e o `sessionId` no `req`.
- Retorna boolean ou lança exception padronizada.

### 4.4 Padronização de 401 e 403

| Código HTTP | Cenários | Comportamento Extra |
|-------------|----------|---------------------|
| **401 Unauthorized** | Cookie ausente/inválido; sessão inexistente/expirada; sessionVersion divergente; user atual inativo/excluído; membership/org atual inativa. | Remover a sessão do Redis e limpar o cookie quando possível. |
| **403 Forbidden** | Sessão válida sem permission requerida; tentativa de trocar para org sem membership; membership alvo inativa/suspensa; ação proibida por role. | Mantém sessão e cookie intactos. |

### 4.5 CurrentAuth Decorator

Extrai o `AuthPrincipal` de maneira limpa.
```typescript
export const CurrentAuth = createParamDecorator(
  (data: keyof AuthPrincipal | undefined, ctx: ExecutionContext): AuthPrincipal | unknown => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.auth) throw new InternalServerErrorException('AuthPrincipal not populated');
    return data ? request.auth[data] : request.auth;
  },
);
```
*(Repositórios devem receber o `organizationId` explicitamente dos controllers. Nunca do body, query ou params).*

### 4.6 PermissionsGuard e RequirePermissions

```typescript
export const RequirePermissions = (...permissions: string[]) => SetMetadata('required_permissions', permissions);
```
- **`PermissionsGuard`**: Usa Reflector para ler permissões. Verifica se `request.auth.permissions` contém as permissões requeridas. Caso negativo, lança `403`.

### 4.7 CSRF com Allowlist (Zod Enum)

`GET /auth/csrf?action=...`

Não aceitaremos qualquer string.
**Schema**: `AuthCsrfActionSchema = z.enum(["auth:logout", "auth:switch-organization"])`
Se action inválida for enviada: rejeitar com `400 Bad Request`.
O frontend deve informar explicitamente a action na requisição.

### 4.8 Endpoints de Organizações e Rotação de Sessão no Switch

#### `GET /auth/organizations`
Retorna as organizações ativas do usuário. (Utiliza schema do pacote `@repo/contracts/src/auth.ts`).

#### `POST /auth/switch-organization`
Deve **Rotacionar a Sessão**:
- Valida sessão, CSRF e membership alvo.
- Gera **NOVO** `sessionId` e **NOVO** `csrfSecret`.
- Preserva `userId`, `sessionVersion`, `createdAt` e `absoluteExpiresAt` da sessão original.
- Atualiza `lastActivityAt`.
- Cria uma nova chave no Redis com os dados rotacionados.
- Remove a chave Redis anterior.
- Envia novo cookie `session_id` assinado ao cliente.

> **Regra Importante**: A troca **não** deve renovar o prazo absoluto de 7 dias (ele permanece baseado no login inicial, copiando o `absoluteExpiresAt` da sessão original).

### 4.9 Auditoria do Switch

Ao trocar de org, gerar um log seguro via `AuditLogRepository`:
- **`organizationId`**: `targetOrganizationId` (A org destino da troca)
- **Metadata Sanitizada**:
  - `fromOrganizationId`
  - `toOrganizationId`
  - `fromMembershipId`
  - `toMembershipId`
- **PROIBIDO incluir**: cookie, token, sessionId, hash da sessão ou csrfSecret na metadata.

---

## 5. Testes Obrigatórios

Testes unitários dos guards/decorators ficarão próximos do código de origem.
Testes reais e integrados ficarão na pasta `test/integration/`.

### 5.1 Testes E2E / Integração

| Cenário | Resultado | Categoria / Detalhes |
|---------|-----------|----------------------|
| Endpoint com cookie ausente/inválido/expirado | 401 | `SessionValidationService` / Retirar cookie |
| Endpoint com sessionVersion ou status inativo | 401 | `SessionValidationService` / Retirar cookie |
| Sessão válida, endpoint protegido mas permissão ausente | 403 | `PermissionsGuard` |
| `GET /auth/organizations` retorna apenas orgs permitidas | 200 | Lista de orgs corretas com `isCurrent` |
| Rotação: `POST /switch-org` para org válida | 204 | Cookie/Redis Key muda, antiga deletada, csrfSecret muda, absoluteExpiresAt e userId/sessionVersion mantidos. |
| Switch negado para org sem membership | 403 | Validação de membership e status no alvo. |
| Isolamento do contexto (Sessão Adulterada Rejeitada) | 401 | Alterar o token bypassando a org resultará em invalidação de sessão. |
| Testes E2E devem usar Nest, PG e Redis REAIS | - | Garantido no CI. |

> **Nota sobre IDOR**: Este marco (3.5) testa as falhas descritas acima, garantindo o isolamento de contexto de autenticação. Os testes completos de IDOR para manipulação de IDs de entidades na URL serão cobertos no **Marco 4A (Connections)** (nenhum endpoint artificial deve ser criado apenas para teste de IDOR agora).

### 5.2 Estrutura de Testes

```
apps/api/src/common/guards/
├── session.guard.spec.ts         # Unit tests próximos ao código
├── permissions.guard.spec.ts     # Unit tests próximos ao código

apps/api/test/integration/auth/
├── organizations.e2e.spec.ts     # Real integrados com Nest, PG, Redis
├── switch-org.e2e.spec.ts        # Real integrados com Nest, PG, Redis
```

---

## 6. Escopo e Arquivos

### 6.1 Criações / Alterações Relevantes (Resumo)

- **Guards e Serviços**: `SessionValidationService`, `SessionGuard`, `PermissionsGuard`, `@CurrentAuth`, `@RequirePermissions`, types do Fastify.
- **Tipos / Contracts**:
  - `packages/contracts/src/auth.ts` -> Schemas de login, action CSRF, e os novos de Org (não usar `schemas.ts` duplicado).
  - Exportar do `packages/contracts/src/index.ts`.
- **Database**:
  - `seed.ts` (popular as ligações de RolePermission).
- **API (Auth)**:
  - Adicionar as rotas `organizations` e `switch-organization` em `auth.controller.ts`.
  - Permitir a action via Zod allowlist no `GET /auth/csrf`.
- **Frontend**:
  - Alterações para o botão do `OrganizationSwitcher` exibir o dropdown (chamando `/auth/organizations`) e disparando a troca de contexto rotacionada com POST.

### 6.2 CI (GitHub Actions)

É um requisito obrigatório (CRITÉRIO GLOBAL) que o projeto contenha um job de integração no CI.
- Banco `PostgreSQL 16`
- Cache/Redis `Redis 7`
- Roda `Prisma migrations` (se houver/se precisar de reset)
- Efetua run do `pnpm test:integration`.

---

## 7. Riscos

| Risco | Prevenção e Escopo de Teste |
|-------|-----------------------------|
| IDOR e Vazamento Cross-Tenant | Repositories exigem `organizationId` explicitamente do controlador (`request.auth.organizationId`). Nenhum `any` nos controllers. Teste real no Marco 4A. |
| Vazamento de Segredos | `AuthPrincipal` não possui `csrfSecret` ou cookies. A tipagem do Fastify impede erros. |
| Bypass de 401/403 Incorreto | Padronização feita: falta de authn (401), falta de authz/target failure (403). Session removida quando aplicável no 401. |
| Session Fixation (Troca de Org) | Rotação completa exigida. `switch-organization` apaga o redis anterior, gera novo sessionId e csrfSecret, e cria novo cookie, mantendo `absoluteExpiresAt`. |
| Action arbitrária CSRF | Enum estrita `AuthCsrfActionSchema` rejeitando falsas ações com 400. |

---

## 8. Plano de Implementação

Use obrigatoriamente a ordem abaixo para commits:

1. **contracts, StoredSession, AuthPrincipal e Fastify types;**
   - Criação de `auth.ts` no `contracts`, tipagens de `AuthPrincipal` e fastify extension (`fastify.d.ts`).
2. **SessionValidationService, SessionGuard e decorator;**
   - Implementar o fluxo de validação no service, usá-lo no guard e prover via `@CurrentAuth`.
3. **PermissionsGuard e unit tests;**
   - Implementação de RBAC decorator/guard e criação dos arquivos spec correspondentes em `src/common/guards/`.
4. **seed RolePermission;**
   - Inserir relações de roles e permissions no script `seed.ts`.
5. **refatoração de me/logout;**
   - Mudar `/auth/me` e `/auth/logout` para usarem os guards e o decorator unificados.
6. **organizations e CSRF allowlist;**
   - Rota de listagem de orgs do usuário e endpoint `/auth/csrf?action=...` travado com Zod Schema.
7. **switch com rotação de sessão;**
   - Endpoint `POST /auth/switch-organization` que rotaciona cookies e secrets sem renovar data absoluta. Registo correto de logs de auditoria sem segredos.
8. **frontend OrganizationSwitcher;**
   - Dropdown real, consumo de hooks ou requisições atualizadas, e manuseio do CSRF.
9. **integração e CI;**
   - Criação dos testes `organizations.e2e.spec.ts` e `switch-org.e2e.spec.ts`. Adição de job do github actions para teste de integração real (PostgreSQL + Redis).
10. **documentação.**
    - Atualização final do `ARCHITECTURE.md` para remover falsos estados de completude e alinhar o `ROADMAP.md`.

---

## Critérios Globais do Marco 3.5

- Nenhum secret (`csrfSecret`, tokens) anexado ao request público/injetável em controllers.
- Nenhuma variável com tipagem `any`.
- Nenhum `organizationId` obtido a partir do `body`, `query` ou `params` servindo como contexto primário do locatário (deve vir via AuthPrincipal).
- Rotação completa da sessão no `switch-organization` (novo sessionId, novo csrfSecret).
- `absoluteExpiresAt` deve ser estritamente preservado ao rotacionar a sessão.
- Testes de integração (reais, integrados) devem rodar obrigatoriamente no CI.
- Documentação do repositório deve estar 100% alinhada com o estado do código.
- Nenhuma funcionalidade envolvendo Meta API faz parte deste escopo.
- Modificar APENAS este plano e não implementar código ainda (parada humana).
