import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const url = 'http://localhost:3000'
const outputDir = path.join(__dirname, '../artifacts')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch()
  const context = await browser.newContext()

  async function snap(route, theme, width, height, filename, setupFn = null) {
    const page = await context.newPage()
    await page.setViewportSize({ width, height })
    await page.goto(`${url}${route}`, { waitUntil: 'load' })
    await page.waitForTimeout(2000)

    await page.evaluate((theme) => {
      localStorage.setItem('theme', theme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      document.documentElement.style.colorScheme = theme
    }, theme)

    await page.waitForTimeout(1000)

    if (setupFn) {
      await setupFn(page)
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: path.join(outputDir, filename), fullPage: true })
    await page.close()
  }

  // 1. Dashboard claro - 1440x900
  await snap('/dashboard', 'light', 1440, 900, 'dashboard-light-desktop.png')
  // 2. Dashboard escuro - 1440x900
  await snap('/dashboard', 'dark', 1440, 900, 'dashboard-dark-desktop.png')
  // 3. Dashboard claro - 390x844
  await snap('/dashboard', 'light', 390, 844, 'dashboard-light-mobile.png')
  // 4. Dashboard escuro - 390x844
  await snap('/dashboard', 'dark', 390, 844, 'dashboard-dark-mobile.png')
  // 5. Dashboard - 768x1024
  await snap('/dashboard', 'light', 768, 1024, 'dashboard-light-768x1024.png')
  
  // 6. Sidebar expandida
  await snap('/dashboard', 'light', 1440, 900, 'sidebar-expanded.png')
  // 7. Sidebar recolhida
  await snap('/dashboard', 'light', 1440, 900, 'sidebar-collapsed.png', async (page) => {
    await page.locator('button:has(.lucide-panel-left-close)').click()
  })

  // 8. Login claro
  await snap('/login', 'light', 1440, 900, 'login-light-desktop.png')
  // 9. Login escuro
  await snap('/login', 'dark', 1440, 900, 'login-dark-desktop.png')

  await browser.close()
  console.log('Screenshots captured successfully!')
}

capture().catch(console.error)
