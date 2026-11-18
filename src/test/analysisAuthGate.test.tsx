import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import InvestmentForm, { type AnalysisInputData } from "@/components/InvestmentForm";

function renderForm(props: {
  onAnalyze: ReturnType<typeof vi.fn>;
  onRequireAuth: ReturnType<typeof vi.fn>;
  isAuthenticated: boolean;
}) {
  return render(
    <I18nProvider>
      <InvestmentForm
        onAnalyze={props.onAnalyze}
        onRequireAuth={props.onRequireAuth}
        isAuthenticated={props.isAuthenticated}
      />
    </I18nProvider>,
  );
}

const ANALYZE = /analizar inversión/i;

describe("registration gate on the Analyze button", () => {
  it("sends a signed-out visitor to registration instead of analyzing", () => {
    const onAnalyze = vi.fn();
    const onRequireAuth = vi.fn();
    renderForm({ onAnalyze, onRequireAuth, isAuthenticated: false });

    fireEvent.click(screen.getByRole("button", { name: ANALYZE }));

    expect(onRequireAuth).toHaveBeenCalledTimes(1);
    expect(onAnalyze).not.toHaveBeenCalled();
    // the payload handed to registration carries what the visitor typed
    const payload = onRequireAuth.mock.calls[0][0] as AnalysisInputData;
    expect(payload.years).toBe(5);
    expect(payload.discountRate).toBe(0.1);
  });

  it("runs the analysis for a signed-in user without asking for registration", () => {
    const onAnalyze = vi.fn();
    const onRequireAuth = vi.fn();
    renderForm({ onAnalyze, onRequireAuth, isAuthenticated: true });

    fireEvent.click(screen.getByRole("button", { name: ANALYZE }));

    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(onRequireAuth).not.toHaveBeenCalled();
  });
});
