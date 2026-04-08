import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Eye, RefreshCw } from "lucide-react";
import { generatePdfDataUrl, exportToPdf } from "@/lib/exportPdf";
import type { Language } from "@/lib/i18n";
import type { Currency, DepreciationConfig } from "@/lib/finance";
import type { ReportSettings } from "@/components/ReportSettingsPanel";
import { useI18n } from "@/lib/i18n";

interface PdfData {
  projectName: string;
  projectDescription: string;
  currency: Currency;
  investment: number;
  discountRate: number;
  taxRate: number;
  npv: number;
  irr: number | null;
  totalReturn: number;
  roi: number;
  paybackPeriod: number | null;
  totalTax: number;
  yearlyData: { income: number; expenses: number }[];
  cashFlows: number[];
  depreciation?: DepreciationConfig;
  reinvestments?: number[];
}

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PdfData;
  reportSettings?: ReportSettings;
}

export default function PdfPreviewModal({ open, onOpenChange, data, reportSettings }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { language, t } = useI18n();

  const generatePreview = useCallback(async () => {
    setLoading(true);
    setPdfUrl(null);
    try {
      const url = await generatePdfDataUrl(data, language, reportSettings);
      setPdfUrl(url);
    } catch (e) {
      console.error("Error generating PDF preview:", e);
    } finally {
      setLoading(false);
    }
  }, [data, language, reportSettings]);

  useEffect(() => {
    if (open) {
      generatePreview();
    } else {
      setPdfUrl(null);
    }
  }, [open, generatePreview]);

  const handleDownload = async () => {
    await exportToPdf(data, language, reportSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Eye className="h-5 w-5 text-primary" />
              {t("preview.title")}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={generatePreview}
                disabled={loading}
                className="gap-1.5 text-muted-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {t("preview.refresh")}
              </Button>
              <Button
                onClick={handleDownload}
                size="sm"
                className="gap-1.5"
                disabled={loading}
              >
                <FileDown className="h-3.5 w-3.5" />
                {t("results.downloadPdf")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/30 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">{t("preview.generating")}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t("preview.error")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
