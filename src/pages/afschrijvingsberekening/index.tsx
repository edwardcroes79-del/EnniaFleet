import { useMemo, useState } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { withAuth } from "@/components/withAuth";
import { Printer } from "lucide-react";

function datedifMonths(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return months;
}

function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "AWG",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function DepreciationPage() {
  const [merk, setMerk] = useState("");
  const [type, setType] = useState("");
  const [bouwjaar, setBouwjaar] = useState("");
  const [factuurwaarde, setFactuurwaarde] = useState("");
  const [ingangsdatum, setIngangsdatum] = useState("");
  const [vervangingsdatum, setVervangingsdatum] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const calculation = useMemo(() => {
    const invoice = parseFloat(factuurwaarde.replace(/\./g, "").replace(",", "."));
    const start = ingangsdatum ? new Date(ingangsdatum) : null;
    const end = vervangingsdatum ? new Date(vervangingsdatum) : null;

    const validationErrors: string[] = [];

    if (factuurwaarde.trim() !== "" && (Number.isNaN(invoice) || invoice <= 0)) {
      validationErrors.push("Factuurwaarde moet een positief bedrag zijn.");
    }

    if (bouwjaar.trim() !== "") {
      const year = parseInt(bouwjaar, 10);
      if (Number.isNaN(year) || year < 1900 || year > 2100) {
        validationErrors.push("Bouwjaar moet een geldig jaar zijn.");
      }
    }

    if (start && end && end < start) {
      validationErrors.push("Vervangingsdatum moet na de ingangsdatum liggen.");
    }

    const hasRequiredValues =
      !Number.isNaN(invoice) &&
      invoice > 0 &&
      start !== null &&
      end !== null &&
      end >= start;

    if (!hasRequiredValues) {
      return {
        totalMonths: null,
        residualValue: null,
        depreciation60: null,
        depreciationPerMonth: null,
        additionalDepreciation: null,
        totalDepreciation: null,
        bookValue: null,
        errors: validationErrors,
      };
    }

    const totalMonths = datedifMonths(start, end);
    const residualValue = invoice * 0.2;
    const depreciation60 = invoice - residualValue;
    const depreciationPerMonth = depreciation60 / 60;
    const additionalDepreciation =
      totalMonths > 60 ? (totalMonths - 60) * depreciationPerMonth : 0;
    const totalDepreciation = depreciation60 + additionalDepreciation;
    const bookValue = invoice - totalDepreciation;

    return {
      totalMonths,
      residualValue,
      depreciation60,
      depreciationPerMonth,
      additionalDepreciation,
      totalDepreciation,
      bookValue,
      errors: validationErrors,
    };
  }, [factuurwaarde, ingangsdatum, vervangingsdatum, bouwjaar]);

  const handleReset = () => {
    setMerk("");
    setType("");
    setBouwjaar("");
    setFactuurwaarde("");
    setIngangsdatum("");
    setVervangingsdatum("");
  };

  const showResults =
    calculation.totalMonths !== null &&
    calculation.errors.length === 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl print-wrapper">
        {/* Print-only document header */}
        <div className="print-only print-document-header">
          <div className="print-logo-container">
            <Image
              src="/Ennia_logo.png"
              alt="ENNIA"
              width={120}
              height={50}
              className="print-logo-image"
              priority
            />
          </div>
          <div className="print-document-title">Depreciation calculation</div>
          <div className="print-document-date">
            {new Date().toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Screen-only title */}
        <div className="screen-only mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">Depreciation calculation</h1>
          <p className="text-sm text-muted-foreground">
            Bereken de afschrijving van een bedrijfsauto op basis van de ingevoerde gegevens.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gegevens auto</CardTitle>
                <CardDescription>Voer de voertuiggegevens handmatig in.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="merk">Merk</Label>
                  <Input
                    id="merk"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    placeholder="Bijv. Volkswagen"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="Bijv. Caddy"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bouwjaar">Bouwjaar</Label>
                  <Input
                    id="bouwjaar"
                    type="number"
                    min="1900"
                    max="2100"
                    value={bouwjaar}
                    onChange={(e) => setBouwjaar(e.target.value)}
                    placeholder="Bijv. 2021"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="factuurwaarde">Factuurwaarde</Label>
                  <Input
                    id="factuurwaarde"
                    type="text"
                    inputMode="decimal"
                    value={factuurwaarde}
                    onChange={(e) => setFactuurwaarde(e.target.value)}
                    placeholder="Bijv. 59950,00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Afschrijvingsperiode</CardTitle>
                <CardDescription>Ingangsdatum en vervangingsdatum van de afschrijving.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ingangsdatum">Ingangsdatum</Label>
                  <Input
                    id="ingangsdatum"
                    type="date"
                    value={ingangsdatum}
                    onChange={(e) => setIngangsdatum(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vervangingsdatum">Vervangingsdatum</Label>
                  <Input
                    id="vervangingsdatum"
                    type="date"
                    value={vervangingsdatum}
                    onChange={(e) => setVervangingsdatum(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 screen-only">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Berekening</CardTitle>
                <CardDescription>Resultaten worden automatisch bijgewerkt.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {calculation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-4">
                        {calculation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3">
                  <ResultRow
                    label="Totale maanden"
                    value={showResults ? `${calculation.totalMonths}` : "—"}
                  />
                  <ResultRow
                    label="Restwaarde"
                    value={formatCurrency(calculation.residualValue)}
                  />
                  <ResultRow
                    label="Afschrijvingskosten 60 mnd"
                    value={formatCurrency(calculation.depreciation60)}
                  />
                  <ResultRow
                    label="Afschrijvingskosten p/m"
                    value={formatCurrency(calculation.depreciationPerMonth)}
                  />
                  <ResultRow
                    label="Additionele afschrijvingkosten"
                    value={formatCurrency(calculation.additionalDepreciation)}
                  />
                  <ResultRow
                    label="Totale afschrijving"
                    value={formatCurrency(calculation.totalDepreciation)}
                    highlight
                  />
                  <ResultRow
                    label="Restwaarde/Boekwaarde"
                    value={formatCurrency(calculation.bookValue)}
                    highlight
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          *,
          *::before,
          *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            background: white !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide absolutely everything from AppShell and UI chrome */
          .app-shell-root > *:not(.app-shell-content),
          .app-shell-sidebar,
          .app-shell-header,
          .app-shell-menu-button,
          .app-shell-sheet,
          aside,
          header,
          nav,
          .screen-only,
          [data-radix-popper-content-wrapper],
          [data-state="open"],
          .ToastViewport,
          [role="dialog"],
          .sheet,
          .sheet-content,
          .radix-dialog,
          .radix-portal {
            display: none !important;
          }

          .app-shell-content {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          main {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          .container-fleet {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Show print-only document header */
          .print-only {
            display: block !important;
          }

          .print-document-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 24pt !important;
            padding-bottom: 12pt !important;
            border-bottom: 1.5pt solid #1e293b !important;
          }

          .print-logo-container {
            display: flex !important;
            align-items: center !important;
          }

          .print-logo-image {
            width: auto !important;
            height: 36pt !important;
            max-width: 140pt !important;
            object-fit: contain !important;
          }

          .print-document-title {
            font-size: 16pt !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            text-align: right !important;
          }

          .print-document-date {
            font-size: 9pt !important;
            color: #475569 !important;
            text-align: right !important;
            margin-top: 4pt !important;
          }

          /* Layout: single column on print */
          .print-wrapper > .grid {
            display: block !important;
            grid-template-columns: none !important;
          }

          .print-wrapper > .grid > div {
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Cards */
          [data-slot="card"] {
            box-shadow: none !important;
            border: 1pt solid #cbd5e1 !important;
            border-radius: 6pt !important;
            break-inside: avoid !important;
            margin-bottom: 14pt !important;
            background: white !important;
          }

          [data-slot="card-header"] {
            padding: 10pt 12pt !important;
            border-bottom: 0.75pt solid #e2e8f0 !important;
            background: #f8fafc !important;
          }

          [data-slot="card-title"] {
            font-size: 12pt !important;
            font-weight: 700 !important;
            color: #1e293b !important;
          }

          [data-slot="card-description"] {
            display: none !important;
          }

          [data-slot="card-content"] {
            padding: 12pt !important;
          }

          /* Inputs: show as plain text lines */
          input,
          select,
          textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-size: 11pt !important;
            color: #0f172a !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          /* Labels */
          label {
            font-size: 9pt !important;
            font-weight: 600 !important;
            color: #475569 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
            margin-bottom: 2pt !important;
          }

          /* Result rows */
          .result-row {
            break-inside: avoid !important;
            border: 0.75pt solid #e2e8f0 !important;
            background: white !important;
            padding: 8pt 10pt !important;
            margin-bottom: 5pt !important;
            border-radius: 4pt !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .result-row-highlight {
            background: #f1f5f9 !important;
            border: 0.75pt solid #94a3b8 !important;
          }

          .result-row span:first-child {
            font-size: 10pt !important;
            color: #475569 !important;
          }

          .result-row span:last-child {
            font-size: 11pt !important;
            font-weight: 600 !important;
            color: #0f172a !important;
          }

          /* Hide empty placeholder text */
          input::placeholder {
            color: transparent !important;
          }

          /* Reduce spacing */
          .space-y-6 > * {
            margin-bottom: 14pt !important;
          }

          .grid.gap-4 {
            gap: 8pt !important;
          }

          .grid.gap-3 {
            gap: 5pt !important;
          }

          /* Typography fine-tuning */
          h1 {
            font-size: 18pt !important;
            margin-bottom: 4pt !important;
          }

          p {
            font-size: 10pt !important;
          }

          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }

          /* Avoid awkward page breaks */
          .print-wrapper,
          [data-slot="card"],
          .result-row {
            page-break-inside: avoid !important;
          }
        }

        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </AppShell>
  );
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-4 py-3 result-row ${
        highlight ? "bg-muted/60 result-row-highlight" : "bg-background"
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${highlight ? "text-base" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}

export default withAuth(DepreciationPage);