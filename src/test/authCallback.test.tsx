import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthCallback from "@/pages/AuthCallback";
import { I18nProvider } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: mocks.unsubscribe } },
      })),
      getSession: vi.fn(),
    },
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const getSession = vi.mocked(supabase.auth.getSession);

function renderCallback() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("Google OAuth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("pendingAnalysis", "1");
    window.history.replaceState({}, "", "/auth/callback");
  });

  it("returns an authenticated person to the app with the pending analysis intact", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null } as any);
    renderCallback();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true }));
    expect(sessionStorage.getItem("pendingAnalysis")).toBe("1");
  });

  it("returns a cancelled Google sign-in to the registration page for retrying", async () => {
    window.history.replaceState({}, "", "/auth/callback?error=access_denied");
    renderCallback();

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/auth", { replace: true }));
    expect(getSession).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("pendingAnalysis")).toBe("1");
  });
});
