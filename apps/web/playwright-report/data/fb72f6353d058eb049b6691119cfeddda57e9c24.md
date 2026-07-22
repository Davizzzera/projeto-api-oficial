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
        - button "Toggle menu" [ref=e48]:
          - img
          - generic [ref=e49]: Toggle menu
        - generic [ref=e50]:
          - button "Notificações" [ref=e51]:
            - img
            - generic [ref=e53]: Notificações
          - button "Toggle theme" [ref=e54]:
            - img
            - generic [ref=e55]: Toggle theme
          - img "@admin" [ref=e58] [cursor=pointer]
      - main [ref=e59]:
        - generic [ref=e60]:
          - generic [ref=e61]:
            - generic [ref=e62]:
              - heading "Visão Geral" [level=1] [ref=e63]
              - paragraph [ref=e64]: Acompanhe o desempenho das suas campanhas e atendimentos.
            - generic [ref=e66]:
              - combobox "Selecionar período" [ref=e67]:
                - generic [ref=e68]: last_7_days
                - img: ▼
              - textbox [ref=e69]: last_7_days
              - combobox "Selecionar conexão" [ref=e70]:
                - generic [ref=e71]: all_connections
                - img: ▼
              - textbox [ref=e72]: all_connections
              - button "Nova Campanha" [ref=e73]:
                - img
                - text: Nova Campanha
          - generic [ref=e74]:
            - generic [ref=e75]:
              - generic [ref=e76]:
                - generic [ref=e77]: Mensagens Enviadas
                - img [ref=e78]
              - generic [ref=e81]:
                - generic [ref=e82]: "24.592"
                - generic [ref=e83]:
                  - img [ref=e84]
                  - paragraph [ref=e87]: +12% em relação ao período anterior
            - generic [ref=e88]:
              - generic [ref=e89]:
                - generic [ref=e90]: Taxa de Entrega
                - img [ref=e91]
              - generic [ref=e94]:
                - generic [ref=e95]: 98,2%
                - generic [ref=e96]:
                  - img [ref=e97]
                  - paragraph [ref=e100]: "-0.5% em relação ao período anterior"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - generic [ref=e103]: Taxa de Leitura
                - img [ref=e104]
              - generic [ref=e107]:
                - generic [ref=e108]: 76,4%
                - generic [ref=e109]:
                  - img [ref=e110]
                  - paragraph [ref=e113]: +4.2% em relação ao período anterior
            - generic [ref=e114]:
              - generic [ref=e115]:
                - generic [ref=e116]: Taxa de Resposta
                - img [ref=e117]
              - generic [ref=e119]:
                - generic [ref=e120]: 12,8%
                - generic [ref=e121]:
                  - img [ref=e122]
                  - paragraph [ref=e123]: Estável em relação ao período anterior
          - generic [ref=e124]:
            - generic [ref=e126]:
              - generic [ref=e127]:
                - generic [ref=e128]: Desempenho de Mensagens
                - generic [ref=e129]: Volume de mensagens enviadas e recebidas nas últimas 12 horas.
              - application [ref=e134]:
                - generic [ref=e141]:
                  - generic [ref=e142]:
                    - generic [ref=e144]: 08:00
                    - generic [ref=e146]: 10:00
                    - generic [ref=e148]: 12:00
                    - generic [ref=e150]: 14:00
                    - generic [ref=e152]: 16:00
                    - generic [ref=e154]: 18:00
                    - generic [ref=e156]: 20:00
                  - generic [ref=e157]:
                    - generic [ref=e159]: "0"
                    - generic [ref=e161]: "150"
                    - generic [ref=e163]: "300"
                    - generic [ref=e165]: "450"
                    - generic [ref=e167]: "600"
            - generic [ref=e169]:
              - generic [ref=e171]: Campanhas Ativas
              - generic [ref=e172]:
                - generic [ref=e173]:
                  - generic [ref=e174]:
                    - generic [ref=e175]: Promoção de Inverno
                    - generic [ref=e176]: 4500 / 5000 (90%)
                  - progressbar [ref=e177]: x
                - generic [ref=e180]:
                  - generic [ref=e181]:
                    - generic [ref=e182]: Lembrete de Vencimento
                    - generic [ref=e183]: 120 / 1200 (10%)
                  - progressbar [ref=e184]: x
                - generic [ref=e187]:
                  - generic [ref=e188]:
                    - generic [ref=e189]: Reativação de Leads
                    - generic [ref=e190]: 890 / 3000 (30%)
                  - progressbar [ref=e191]: x
          - generic [ref=e194]:
            - generic [ref=e195]:
              - generic [ref=e196]:
                - generic [ref=e197]: Atividade Recente
                - button "Ver todos" [ref=e198]:
                  - text: Ver todos
                  - img
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - generic [ref=e202]:
                    - img [ref=e204]
                    - generic [ref=e206]:
                      - paragraph [ref=e207]: Novo atendimento iniciado
                      - paragraph [ref=e208]: +55 11 99999-9999
                  - generic [ref=e209]: Há 5 min
                - generic [ref=e210]:
                  - generic [ref=e211]:
                    - img [ref=e213]
                    - generic [ref=e215]:
                      - paragraph [ref=e216]: Novo atendimento iniciado
                      - paragraph [ref=e217]: +55 11 99999-9999
                  - generic [ref=e218]: Há 5 min
                - generic [ref=e219]:
                  - generic [ref=e220]:
                    - img [ref=e222]
                    - generic [ref=e224]:
                      - paragraph [ref=e225]: Novo atendimento iniciado
                      - paragraph [ref=e226]: +55 11 99999-9999
                  - generic [ref=e227]: Há 5 min
            - generic [ref=e228]:
              - generic [ref=e229]:
                - generic [ref=e231]: Status das Conexões
                - generic [ref=e232]:
                  - generic [ref=e233]:
                    - generic [ref=e234]: WABA Oficial 1
                    - generic [ref=e237]: Conectado
                  - generic [ref=e238]:
                    - generic [ref=e239]: WABA Suporte
                    - generic [ref=e242]: Rate Limit
              - generic [ref=e243]:
                - generic [ref=e245]:
                  - img [ref=e246]
                  - text: Alertas
                - generic [ref=e248]:
                  - paragraph [ref=e249]: O template "Aviso_Corte" foi rejeitado pela Meta e não poderá ser enviado.
                  - button "Ver detalhes" [ref=e250]
  - alert [ref=e251]
  - generic [ref=e252]: "0"
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