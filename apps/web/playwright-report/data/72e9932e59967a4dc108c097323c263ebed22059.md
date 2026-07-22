# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Dashboard Objective Validations >> Dashboard exibe labels em português e não exibe valores técnicos
- Location: e2e\app.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text="Últimos 7 dias"')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text="Últimos 7 dias"')

```

```yaml
- complementary:
  - link "Nexus":
    - /url: /dashboard
  - navigation:
    - text: Visão geral
    - link "Dashboard":
      - /url: /dashboard
    - text: Operação
    - link "Atendimento":
      - /url: /inbox
    - link "Campanhas":
      - /url: /campaigns
    - link "Contatos":
      - /url: /contacts
    - link "Templates":
      - /url: /templates
    - text: Automação
    - link "Fluxos":
      - /url: /flows
    - text: Análises
    - link "Relatórios":
      - /url: /reports
    - text: Administração
    - link "Conexões":
      - /url: /connections
    - link "Usuários":
      - /url: /users
    - link "Configurações":
      - /url: /settings
- banner:
  - button "Toggle menu"
  - button "Notificações"
  - button "Toggle theme"
  - img "@admin"
- main:
  - heading "Visão Geral" [level=1]
  - paragraph: Acompanhe o desempenho das suas campanhas e atendimentos.
  - combobox "Selecionar período": last_7_days
  - combobox "Selecionar conexão": all_connections
  - button "Nova Campanha"
  - text: Mensagens Enviadas 24.592
  - paragraph: +12% em relação ao período anterior
  - text: Taxa de Entrega 98,2%
  - paragraph: "-0.5% em relação ao período anterior"
  - text: Taxa de Leitura 76,4%
  - paragraph: +4.2% em relação ao período anterior
  - text: Taxa de Resposta 12,8%
  - paragraph: Estável em relação ao período anterior
  - text: Desempenho de Mensagens Volume de mensagens enviadas e recebidas nas últimas 12 horas.
  - application: 08:00 10:00 12:00 14:00 16:00 18:00 20:00 0 150 300 450 600
  - text: Campanhas Ativas Promoção de Inverno 4500 / 5000 (90%)
  - progressbar: x
  - text: Lembrete de Vencimento 120 / 1200 (10%)
  - progressbar: x
  - text: Reativação de Leads 890 / 3000 (30%)
  - progressbar: x
  - text: Atividade Recente
  - button "Ver todos"
  - paragraph: Novo atendimento iniciado
  - paragraph: +55 11 99999-9999
  - text: Há 5 min
  - paragraph: Novo atendimento iniciado
  - paragraph: +55 11 99999-9999
  - text: Há 5 min
  - paragraph: Novo atendimento iniciado
  - paragraph: +55 11 99999-9999
  - text: Há 5 min Status das Conexões WABA Oficial 1 Conectado WABA Suporte Rate Limit Alertas
  - paragraph: O template "Aviso_Corte" foi rejeitado pela Meta e não poderá ser enviado.
  - button "Ver detalhes"
- alert
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
> 10 |     await expect(page.locator('text="Últimos 7 dias"')).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
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
  54 |     await page.click('button[aria-label="Toggle theme"]');
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