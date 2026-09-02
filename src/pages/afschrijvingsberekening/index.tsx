import { useMemo, useState } from "react";
import Head from "next/head";
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
    <>
      <Head>
        <title>Depreciation calculation</title>
        <meta name="description" content="ENNIA Fleet depreciation calculation" />
      </Head>
      <AppShell>
        <div className="mx-auto max-w-5xl print-wrapper">
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0mm;
              }

              html,
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .app-shell-root > *:not(.app-shell-content),
              .app-shell-sidebar,
              .app-shell-header,
              .app-shell-menu-button,
              .app-shell-sheet,
              aside,
              header,
              nav,
              .screen-only,
              button,
              [role="button"],
              a[href],
              a,
              [role="link"],
              [href],
              [data-radix-popper-content-wrapper],
              [data-state="open"],
              .ToastViewport,
              [role="dialog"],
              .sheet,
              .sheet-content,
              .radix-dialog,
              .radix-portal,
              #vercel-live-toolbar,
              vercel-live-toolbar,
              nextjs-portal {
                display: none !important;
              }

              .container-fleet,
              main {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }

              .print-wrapper {
                padding: 15mm !important;
                min-height: 100vh !important;
                box-sizing: border-box !important;
              }

              [data-slot="card"] {
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                break-inside: avoid;
                margin-bottom: 16px;
              }

              [data-slot="card-header"] {
                padding-bottom: 12px !important;
                border-bottom: 1px solid #e2e8f0 !important;
              }

              [data-slot="card-title"] {
                font-size: 14px !important;
                font-weight: 700 !important;
              }

              [data-slot="card-description"] {
                display: none !important;
              }

              .result-row {
                break-inside: avoid;
                border: 1px solid #e2e8f0 !important;
                background: white !important;
                padding: 10px 12px !important;
                margin-bottom: 6px !important;
                border-radius: 4px !important;
              }

              .result-row-highlight {
                background: #f1f5f9 !important;
                border: 1px solid #94a3b8 !important;
              }

              .print-document-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 24pt !important;
                padding-bottom: 12pt !important;
                border-bottom: 1.5pt solid #1e293b !important;
              }

              .print-logo-image {
                width: auto !important;
                height: 44pt !important;
                max-width: 170pt !important;
                object-fit: contain !important;
              }

              .print-document-meta {
                text-align: right !important;
              }

              .print-document-title {
                font-size: 16pt !important;
                font-weight: 700 !important;
                color: #1e293b !important;
              }

              .print-document-date {
                font-size: 9pt !important;
                color: #475569 !important;
                margin-top: 4pt !important;
              }

              .print-document-footer {
                margin-top: 40pt !important;
                padding-top: 12pt !important;
                border-top: 1.5pt solid #e2e8f0 !important;
                text-align: right !important;
                font-size: 9pt !important;
                color: #475569 !important;
              }

              .print-layout-grid {
                display: block !important;
              }

              .print-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                margin-bottom: 24pt !important;
              }

              .berekening-block {
                break-before: page !important;
                page-break-before: always !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .print-page2-spacer {
                display: block !important;
                height: 35mm !important;
              }

              .berekening-card {
                margin-top: 140pt !important;
              }

              .font-mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                font-size: 12px !important;
              }
            }
          `}</style>

          <style jsx>{`
            .print-document-header {
              display: none;
            }
            @media screen {
              .print-only {
                display: none;
              }
              .screen-only {
                display: inline-flex;
              }
            }
            @media print {
              .print-only {
                display: block;
              }
              .print-document-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
            }
            .print-page2-spacer {
              display: none;
            }
          `}</style>

          <div className="print-only print-document-header">
            <div className="print-logo-container">
              <Image
                src="/Ennia_logo.png"
                alt="ENNIA"
                width={160}
                height={66}
                className="print-logo-image"
                priority
              />
            </div>
            <div className="print-document-meta">
              <div className="print-document-title">Depreciation calculation</div>
            </div>
          </div>

          <div className="screen-only mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">Depreciation calculation</h1>
            <p className="text-sm text-muted-foreground">
              Bereken de afschrijving van een bedrijfsauto op basis van de ingevoerde gegevens.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 print-layout-grid">
            <div className="space-y-6">
              <Card className="print-avoid-break">
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

              <Card className="print-avoid-break">
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
              <div className="berekening-block">
                <div className="print-page2-spacer" aria-hidden="true" />
                <Card className="print-avoid-break">
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
        </div>
      </AppShell>
    </>
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