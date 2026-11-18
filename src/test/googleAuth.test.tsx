import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "@/pages/Auth";
import { I18nProvider } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable/index";

const navigate = vi.fn();

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/components/Seo", () => ({
  default: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const signInWithOAuth = vi.mocked(lovable.auth.signInWithOAuth);

describe("Google registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("pendingAnalysis", "1");
    sessionStorage.setItem("pendingAnalysisData", JSON.stringify({ projectName: "Test project" }));
  });

  it("uses the same-origin public callback and preserves the pending analysis", async () => {
    signInWithOAuth.mockResolvedValue({ redirected: true, error: null });
    render(
      <I18nProvider>
        <MemoryRouter>
          <Auth />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(signInWithOAuth).toHaveBeenCalledWith("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    expect(sessionStorage.getItem("pendingAnalysis")).toBe("1");
    expect(sessionStorage.getItem("pendingAnalysisData")).toContain("Test project");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns to the app without leaving the sign-in page in browser history", async () => {
    signInWithOAuth.mockResolvedValue({ redirected: false, error: null });
    render(
      <I18nProvider>
        <MemoryRouter>
          <Auth />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/", { replace: true }));
  });
});
