import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import UserMenu from "./user-menu"
import { LayoutContext } from "./layout-context"
import { vi, Mock } from "vitest"

const mockRouterReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}))

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it("should open menu and perform logout successfully", async () => {
    const mockUser = { id: "1", name: "Test User", email: "test@example.com" }
    const mockOrg = { id: "1", name: "Test Org", slug: "test-org" }

    ;(global.fetch as Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: "mock-csrf-token" }),
      })
      .mockResolvedValueOnce({
        status: 204,
        ok: true,
      })

    render(
      <LayoutContext.Provider
        value={{
          sidebarOpen: false,
          setSidebarOpen: vi.fn(),
          sidebarCollapsed: false,
          setSidebarCollapsed: vi.fn(),
          user: mockUser,
          organization: mockOrg,
        }}
      >
        <UserMenu />
      </LayoutContext.Provider>
    )

    // Find and click avatar to open menu
    const avatar = screen.getByText("TE")
    fireEvent.click(avatar)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
    })
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("Test Org")).toBeInTheDocument()

    // Find and click logout button
    const logoutBtn = screen.getByText("Sair")
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/login")
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/auth/csrf?action=auth:logout", expect.any(Object))
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": "mock-csrf-token" },
    })
  })

  it("should show error message when logout fails", async () => {
    const mockUser = { id: "1", name: "Test User", email: "test@example.com" }
    const mockOrg = { id: "1", name: "Test Org", slug: "test-org" }

    ;(global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
    })

    render(
      <LayoutContext.Provider
        value={{
          sidebarOpen: false,
          setSidebarOpen: vi.fn(),
          sidebarCollapsed: false,
          setSidebarCollapsed: vi.fn(),
          user: mockUser,
          organization: mockOrg,
        }}
      >
        <UserMenu />
      </LayoutContext.Provider>
    )

    // Find and click avatar to open menu
    const avatar = screen.getByText("TE")
    fireEvent.click(avatar)

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByText("Sair")).toBeInTheDocument()
    })

    // Find and click logout button
    const logoutBtn = screen.getByText("Sair")
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(screen.getByText("Não foi possível sair. Tente novamente.")).toBeInTheDocument()
    })
    
    // Check if aria-live is polite
    const errorMsg = screen.getByText("Não foi possível sair. Tente novamente.")
    expect(errorMsg.getAttribute("aria-live")).toBe("polite")
  })
})
