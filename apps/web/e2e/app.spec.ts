import { test, expect } from '@playwright/test';

test.describe('Dashboard Objective Validations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('load');
  });

  test('Dashboard exibe labels em português e não exibe valores técnicos', async ({ page }) => {
    await expect(page.locator('text="Últimos 7 dias"')).toBeVisible();
    await expect(page.locator('text="Todas as conexões"')).toBeVisible();
    
    // Confirma ausência do texto técnico "7d" e "all" de forma visual literal
    const bodyText = await page.evaluate(() => document.body.innerText);
    // Verificamos " 7d " ou valores exatos que não sejam substrings como "7 dias"
    expect(bodyText).not.toMatch(/\b7d\b/);
    expect(bodyText).not.toMatch(/\ball\b/);
    expect(bodyText).not.toMatch(/\blast_7_days\b/);
  });

  test('AppShell e Sidebar: recolhida e expandida', async ({ page, isMobile }) => {
    if (isMobile) {
      // Abre o drawer mobile
      await page.click('button:has(.lucide-menu)');
      await expect(page.locator('aside')).toHaveClass(/translate-x-0/);
      
      // Clica no backdrop para fechar (se houver, ou apenas o fato de ter a classe)
      await page.click('.bg-background\\/80');
      await expect(page.locator('aside')).not.toHaveClass(/translate-x-0/);
    } else {
      // Desktop: testa toggle
      const sidebar = page.locator('aside');
      // Por padrão pode estar expandida (248px)
      await expect(sidebar).toHaveClass(/w-\[248px\]/);
      
      await page.click('button:has(.lucide-panel-left-close)');
      // Agora deve estar recolhida
      await expect(sidebar).toHaveClass(/w-\[72px\]/);
    }
  });

  test('Nenhum overflow horizontal (scrollWidth <= clientWidth)', async ({ page }) => {
    const hasOverflow = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      return scrollWidth > clientWidth;
    });
    
    expect(hasOverflow).toBe(false);
  });

  test('Temas claro e escuro funcionam sem quebrar layout', async ({ page }) => {
    // Muda para escuro
    await page.click('button[aria-label="Toggle theme"]');
    await page.click('text="Dark"');
    
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Muda para claro
    await page.click('button[aria-label="Toggle theme"]');
    await page.click('text="Light"');
    
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
