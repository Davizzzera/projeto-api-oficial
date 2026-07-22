# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Dashboard Objective Validations >> AppShell e Sidebar: recolhida e expandida
- Location: e2e\app.spec.ts:21:7

# Error details

```
Error: expect(locator).not.toHaveClass(expected) failed

Locator: locator('aside')
Expected pattern: not /translate-x-0/
Received string: "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-surface transition-all duration-300 ease-in-out font-sans -translate-x-full md:translate-x-0 w-[248px]"
Timeout: 5000ms

Call log:
  - Expect "not toHaveClass" with timeout 5000ms
  - waiting for locator('aside')
    13 × locator resolved to <aside class="fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-surface transition-all duration-300 ease-in-out font-sans -translate-x-full md:translate-x-0 w-[248px]">…</aside>
       - unexpected value "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-surface transition-all duration-300 ease-in-out font-sans -translate-x-full md:translate-x-0 w-[248px]"

```

```yaml
- complementary:
  - link "Nexus":
    - /url: /dashboard
  - navigation
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
> 29 |       await expect(page.locator('aside')).not.toHaveClass(/translate-x-0/);
     |                                               ^ Error: expect(locator).not.toHaveClass(expected) failed
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