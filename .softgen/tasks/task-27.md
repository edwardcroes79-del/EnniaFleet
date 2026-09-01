---
title: Afschrijvingsberekening calculator
status: in_progress
priority: high
type: feature
tags: [calculator, standalone]
created_by: agent
created_at: 2026-09-01T14:30:00Z
position: 27
---

## Notes
Standalone depreciation calculator tab based on Excel "Afsc
...
ules:

- Restwaarde = 20% * Factuurwaarde
- Afschrijvingskosten 60 mnd = Factuurwaarde - Restwaarde
- Afschrijvingskosten p/m = Afschrijvingskosten 60 mnd / 60
- Totale maanden = DATEDIF(Ingangsdatum, Vervangingsdatum, "m")
- Additionele afschrijvingkosten = IF(Totale maanden > 60, (Totale maanden - 60) * (pm-waarde), 0)
- Totale afschrijving = 60mnd-kosten + Additionele
- Restwaarde/Boekwaarde = Factuurwaarde - Totale afschrijving

## Checklist
- [x] Excel-formules geverifieerd (B11, B13, E5, E6, B15, E7, B17)
- [ ] Calculator-pagina aangemaakt met inputs Merk/Type/Bouwjaar/Factuurwaarde + datumvelden
- [ ] Live berekening met volledige precisie, alleen weergave afronden op 2 decimalen
- [ ] Validatie inclusief "Vervangingsdatum moet na de ingangsdatum liggen."
- [ ] Reset-knop die alle velden leegt
- [ ] Menu-item "Afschrijvingsberekening" in AppShell
- [ ] Responsief ontwerp, geen database of API

## Acceptance
- Calculator werkt volledig client-side zonder Supabase-calls
- Voorbeeld VW Caddy 59.950 / 01-08-2026 → 01-08-2031 geeft exact: 60 mnd, 11.990,00, 47.960,00, 799,33, 0,00, 47.960,00, 11.990,00
- Reset maakt alles leeg; ongeldige datumreeks toont foutmelding en rekent niet