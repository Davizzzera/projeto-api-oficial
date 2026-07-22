# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Dashboard Objective Validations >> Temas claro e escuro funcionam sem quebrar layout
- Location: e2e\app.spec.ts:52:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[aria-label="Toggle theme"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - link "Nexus" [ref=e5] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e7]
        - generic [ref=e12]: Nexus
      - navigation [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Visão geral
          - link "Dashboard" [ref=e17] [cursor=pointer]:
            - /url: /dashboard
            - img
            - generic [ref=e18]: Dashboard
        - generic [ref=e19]:
          - generic [ref=e20]: Operação
          - link "Atendimento" [ref=e21] [cursor=pointer]:
            - /url: /inbox
            - img
            - generic [ref=e22]: Atendimento
          - link "Campanhas" [ref=e23] [cursor=pointer]:
            - /url: /campaigns
            - img
            - generic [ref=e24]: Campanhas
          - link "Contatos" [ref=e25] [cursor=pointer]:
            - /url: /contacts
            - img
            - generic [ref=e26]: Contatos
          - link "Templates" [ref=e27] [cursor=pointer]:
            - /url: /templates
            - img
            - generic [ref=e28]: Templates
        - generic [ref=e29]:
          - generic [ref=e30]: Automação
          - link "Fluxos" [ref=e31] [cursor=pointer]:
            - /url: /flows
            - img
            - generic [ref=e32]: Fluxos
        - generic [ref=e33]:
          - generic [ref=e34]: Análises
          - link "Relatórios" [ref=e35] [cursor=pointer]:
            - /url: /reports
            - img
            - generic [ref=e36]: Relatórios
        - generic [ref=e37]:
          - generic [ref=e38]: Administração
          - link "Conexões" [ref=e39] [cursor=pointer]:
            - /url: /connections
            - img
            - generic [ref=e40]: Conexões
          - link "Usuários" [ref=e41] [cursor=pointer]:
            - /url: /users
            - img
            - generic [ref=e42]: Usuários
          - link "Configurações" [ref=e43] [cursor=pointer]:
            - /url: /settings
            - img
            - generic [ref=e44]: Configurações
    - generic [ref=e45]:
      - banner [ref=e46]:
        - generic [ref=e47]:
          - button "Toggle sidebar" [ref=e48]:
            - img
            - generic [ref=e49]: Toggle sidebar
          - button "Acme Corp Inc." [ref=e51]:
            - generic [ref=e52]:
              - generic [ref=e53]:
                - img
              - generic [ref=e54]: Acme Corp Inc.
            - img
        - generic [ref=e55]:
          - generic [ref=e56]:
            - img [ref=e57]
            - searchbox "Buscar..." [ref=e60]
          - button "Notificações" [ref=e61]:
            - img
            - generic [ref=e63]: Notificações
          - button "Toggle theme" [ref=e64]:
            - img
            - generic [ref=e65]: Toggle theme
          - img "@admin" [ref=e68] [cursor=pointer]
      - main [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]:
            - generic [ref=e72]:
              - heading "Visão Geral" [level=1] [ref=e73]
              - paragraph [ref=e74]: Acompanhe o desempenho das suas campanhas e atendimentos.
            - generic [ref=e76]:
              - combobox "Selecionar período" [ref=e77]:
                - generic [ref=e78]: last_7_days
                - img: ▼
              - textbox [ref=e79]: last_7_days
              - combobox "Selecionar conexão" [ref=e80]:
                - generic [ref=e81]: all_connections
                - img: ▼
              - textbox [ref=e82]: all_connections
              - button "Nova Campanha" [ref=e83]:
                - img
                - text: Nova Campanha
          - generic [ref=e84]:
            - generic [ref=e85]:
              - generic [ref=e86]:
                - generic [ref=e87]: Mensagens Enviadas
                - img [ref=e88]
              - generic [ref=e91]:
                - generic [ref=e92]: "24.592"
                - generic [ref=e93]:
                  - img [ref=e94]
                  - paragraph [ref=e97]: +12% em relação ao período anterior
            - generic [ref=e98]:
              - generic [ref=e99]:
                - generic [ref=e100]: Taxa de Entrega
                - img [ref=e101]
              - generic [ref=e104]:
                - generic [ref=e105]: 98,2%
                - generic [ref=e106]:
                  - img [ref=e107]
                  - paragraph [ref=e110]: "-0.5% em relação ao período anterior"
            - generic [ref=e111]:
              - generic [ref=e112]:
                - generic [ref=e113]: Taxa de Leitura
                - img [ref=e114]
              - generic [ref=e117]:
                - generic [ref=e118]: 76,4%
                - generic [ref=e119]:
                  - img [ref=e120]
                  - paragraph [ref=e123]: +4.2% em relação ao período anterior
            - generic [ref=e124]:
              - generic [ref=e125]:
                - generic [ref=e126]: Taxa de Resposta
                - img [ref=e127]
              - generic [ref=e129]:
                - generic [ref=e130]: 12,8%
                - generic [ref=e131]:
                  - img [ref=e132]
                  - paragraph [ref=e133]: Estável em relação ao período anterior
          - generic [ref=e134]:
            - generic [ref=e136]:
              - generic [ref=e137]:
                - generic [ref=e138]: Desempenho de Mensagens
                - generic [ref=e139]: Volume de mensagens enviadas e recebidas nas últimas 12 horas.
              - application [ref=e144]:
                - generic [ref=e151]:
                  - generic [ref=e152]:
                    - generic [ref=e154]: 08:00
                    - generic [ref=e156]: 10:00
                    - generic [ref=e158]: 12:00
                    - generic [ref=e160]: 14:00
                    - generic [ref=e162]: 16:00
                    - generic [ref=e164]: 18:00
                    - generic [ref=e166]: 20:00
                  - generic [ref=e167]:
                    - generic [ref=e169]: "0"
                    - generic [ref=e171]: "150"
                    - generic [ref=e173]: "300"
                    - generic [ref=e175]: "450"
                    - generic [ref=e177]: "600"
            - generic [ref=e179]:
              - generic [ref=e181]: Campanhas Ativas
              - generic [ref=e182]:
                - generic [ref=e183]:
                  - generic [ref=e184]:
                    - generic [ref=e185]: Promoção de Inverno
                    - generic [ref=e186]: 4500 / 5000 (90%)
                  - progressbar [ref=e187]: x
                - generic [ref=e190]:
                  - generic [ref=e191]:
                    - generic [ref=e192]: Lembrete de Vencimento
                    - generic [ref=e193]: 120 / 1200 (10%)
                  - progressbar [ref=e194]: x
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - generic [ref=e199]: Reativação de Leads
                    - generic [ref=e200]: 890 / 3000 (30%)
                  - progressbar [ref=e201]: x
          - generic [ref=e204]:
            - generic [ref=e205]:
              - generic [ref=e206]:
                - generic [ref=e207]: Atividade Recente
                - button "Ver todos" [ref=e208]:
                  - text: Ver todos
                  - img
              - generic [ref=e210]:
                - generic [ref=e211]:
                  - generic [ref=e212]:
                    - img [ref=e214]
                    - generic [ref=e216]:
                      - paragraph [ref=e217]: Novo atendimento iniciado
                      - paragraph [ref=e218]: +55 11 99999-9999
                  - generic [ref=e219]: Há 5 min
                - generic [ref=e220]:
                  - generic [ref=e221]:
                    - img [ref=e223]
                    - generic [ref=e225]:
                      - paragraph [ref=e226]: Novo atendimento iniciado
                      - paragraph [ref=e227]: +55 11 99999-9999
                  - generic [ref=e228]: Há 5 min
                - generic [ref=e229]:
                  - generic [ref=e230]:
                    - img [ref=e232]
                    - generic [ref=e234]:
                      - paragraph [ref=e235]: Novo atendimento iniciado
                      - paragraph [ref=e236]: +55 11 99999-9999
                  - generic [ref=e237]: Há 5 min
            - generic [ref=e238]:
              - generic [ref=e239]:
                - generic [ref=e241]: Status das Conexões
                - generic [ref=e242]:
                  - generic [ref=e243]:
                    - generic [ref=e244]: WABA Oficial 1
                    - generic [ref=e247]: Conectado
                  - generic [ref=e248]:
                    - generic [ref=e249]: WABA Suporte
                    - generic [ref=e252]: Rate Limit
              - generic [ref=e253]:
                - generic [ref=e255]:
                  - img [ref=e256]
                  - text: Alertas
                - generic [ref=e258]:
                  - paragraph [ref=e259]: O template "Aviso_Corte" foi rejeitado pela Meta e não poderá ser enviado.
                  - button "Ver detalhes" [ref=e260]
  - alert [ref=e261]
  - generic [ref=e262]: "0"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Objective Validations', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:3000/dashboard');
  6  |     await page.waitForLoadState('load');
  7  |   });
  8  | 
  9  |   test('Dashboard exibe labels em português e não exibe valores técnicos', async ({ page }) => {
  10 |     await expect(page.locator('text="Últimos 7 dias"')).toBeVisible();
  11 |     await expect(page.locator('text="Todas as conexões"')).toBeVisible();
  12 |     
  13 |     // Confirma ausência do texto técnico "7d" e "all" de forma visual literal
  14 |     const bodyText = await page.evaluate(() => document.body.innerText);
  15 |     // Verificamos " 7d " ou valores exatos que não sejam substrings como "7 dias"
  16 |     expect(bodyText).not.toMatch(/\b7d\b/);
  17 |     expect(bodyText).not.toMatch(/\ball\b/);
  18 |     expect(bodyText).not.toMatch(/\blast_7_days\b/);
  19 |   });
  20 | 
  21 |   test('AppShell e Sidebar: recolhida e expandida', async ({ page, isMobile }) => {
  22 |     if (isMobile) {
  23 |       // Abre o drawer mobile
  24 |       await page.click('button:has(.lucide-menu)');
  25 |       await expect(page.locator('aside')).toHaveClass(/translate-x-0/);
  26 |       
  27 |       // Clica no backdrop para fechar (se houver, ou apenas o fato de ter a classe)
  28 |       await page.click('.bg-background\\/80');
  29 |       await expect(page.locator('aside')).not.toHaveClass(/translate-x-0/);
  30 |     } else {
  31 |       // Desktop: testa toggle
  32 |       const sidebar = page.locator('aside');
  33 |       // Por padrão pode estar expandida (248px)
  34 |       await expect(sidebar).toHaveClass(/w-\[248px\]/);
  35 |       
  36 |       await page.click('button:has(.lucide-panel-left-close)');
  37 |       // Agora deve estar recolhida
  38 |       await expect(sidebar).toHaveClass(/w-\[72px\]/);
  39 |     }
  40 |   });
  41 | 
  42 |   test('Nenhum overflow horizontal (scrollWidth <= clientWidth)', async ({ page }) => {
  43 |     const hasOverflow = await page.evaluate(() => {
  44 |       const scrollWidth = document.documentElement.scrollWidth;
  45 |       const clientWidth = document.documentElement.clientWidth;
  46 |       return scrollWidth > clientWidth;
  47 |     });
  48 |     
  49 |     expect(hasOverflow).toBe(false);
  50 |   });
  51 | 
  52 |   test('Temas claro e escuro funcionam sem quebrar layout', async ({ page }) => {
  53 |     // Muda para escuro
> 54 |     await page.click('button[aria-label="Toggle theme"]');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  55 |     await page.click('text="Dark"');
  56 |     
  57 |     await expect(page.locator('html')).toHaveClass(/dark/);
  58 |     
  59 |     // Muda para claro
  60 |     await page.click('button[aria-label="Toggle theme"]');
  61 |     await page.click('text="Light"');
  62 |     
  63 |     await expect(page.locator('html')).not.toHaveClass(/dark/);
  64 |   });
  65 | });
  66 | 
```