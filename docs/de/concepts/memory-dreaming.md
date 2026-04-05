---
read_when:
    - Sie möchten, dass die Gedächtnis-Promotion automatisch ausgeführt wird
    - Sie möchten Dreaming-Modi und Schwellenwerte verstehen
    - Sie möchten die Konsolidierung abstimmen, ohne `MEMORY.md` zu verunreinigen
summary: Hintergrund-Promotion von Kurzzeiterinnerungen in das Langzeitgedächtnis
title: Dreaming (experimentell)
x-i18n:
    generated_at: "2026-04-05T12:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (experimentell)

Dreaming ist der Hintergrunddurchlauf zur Gedächtniskonsolidierung in `memory-core`.

Es wird „Dreaming“ genannt, weil das System erneut betrachtet, was im Laufe des Tages aufgekommen ist,
und entscheidet, was es wert ist, als dauerhafter Kontext erhalten zu bleiben.

Dreaming ist **experimentell**, **Opt-in** und standardmäßig **deaktiviert**.

## Was Dreaming macht

1. Verfolgt Kurzzeiterinnerungs-Ereignisse aus `memory_search`-Treffern in
   `memory/YYYY-MM-DD.md`.
2. Bewertet diese Erinnerungskandidaten mit gewichteten Signalen.
3. Überträgt nur qualifizierte Kandidaten in `MEMORY.md`.

So bleibt das Langzeitgedächtnis auf dauerhaften, wiederkehrenden Kontext fokussiert statt auf
einmalige Details.

## Promotionssignale

Dreaming kombiniert vier Signale:

- **Häufigkeit**: wie oft derselbe Kandidat erinnert wurde.
- **Relevanz**: wie stark die Erinnerungswerte beim Abruf waren.
- **Anfragevielfalt**: wie viele unterschiedliche Anfrageabsichten ihn sichtbar gemacht haben.
- **Aktualität**: zeitliche Gewichtung über aktuelle Erinnerungen.

Eine Promotion erfordert, dass alle konfigurierten Schwellenwert-Gates bestanden werden, nicht nur ein Signal.

### Signalgewichte

| Signal      | Gewicht | Beschreibung                                           |
| ----------- | ------- | ------------------------------------------------------ |
| Häufigkeit  | 0.35    | Wie oft derselbe Eintrag erinnert wurde                |
| Relevanz    | 0.35    | Durchschnittliche Erinnerungswerte beim Abruf          |
| Vielfalt    | 0.15    | Anzahl unterschiedlicher Anfrageabsichten, die ihn sichtbar machten |
| Aktualität  | 0.15    | Zeitlicher Zerfall (Halbwertszeit von 14 Tagen)        |

## So funktioniert es

1. **Erinnerungsverfolgung** -- Jeder `memory_search`-Treffer wird in
   `memory/.dreams/short-term-recall.json` mit Erinnerungsanzahl, Werten und Anfrage-
   Hash aufgezeichnet.
2. **Geplante Bewertung** -- In der konfigurierten Kadenz werden Kandidaten mithilfe
   gewichteter Signale eingestuft. Alle Schwellenwert-Gates müssen gleichzeitig bestanden werden.
3. **Promotion** -- Qualifizierte Einträge werden mit einem
   Promotion-Zeitstempel an `MEMORY.md` angehängt.
4. **Bereinigung** -- Bereits übertragene Einträge werden aus zukünftigen Zyklen herausgefiltert. Eine
   Dateisperre verhindert gleichzeitige Ausführungen.

## Modi

`dreaming.mode` steuert Kadenz und Standardschwellenwerte:

| Modus  | Kadenz          | minScore | minRecallCount | minUniqueQueries |
| ------ | --------------- | -------- | -------------- | ---------------- |
| `off`  | Deaktiviert     | --       | --             | --               |
| `core` | Täglich 3 Uhr   | 0.75     | 3              | 2                |
| `rem`  | Alle 6 Stunden  | 0.85     | 4              | 3                |
| `deep` | Alle 12 Stunden | 0.80     | 3              | 3                |

## Planungsmodell

Wenn Dreaming aktiviert ist, verwaltet `memory-core` den wiederkehrenden Zeitplan
automatisch. Sie müssen für dieses Feature nicht manuell einen Cron-Job erstellen.

Sie können das Verhalten weiterhin mit expliziten Überschreibungen abstimmen, zum Beispiel:

- `dreaming.frequency` (Cron-Ausdruck)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Konfigurieren

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## Chat-Befehle

Modi wechseln und Status im Chat prüfen:

```
/dreaming core          # Zu core-Modus wechseln (nächtlich)
/dreaming rem           # Zu rem-Modus wechseln (alle 6 h)
/dreaming deep          # Zu deep-Modus wechseln (alle 12 h)
/dreaming off           # Dreaming deaktivieren
/dreaming status        # Aktuelle Konfiguration und Kadenz anzeigen
/dreaming help          # Modus-Leitfaden anzeigen
```

## CLI-Befehle

Promotionen über die Befehlszeile in der Vorschau anzeigen und anwenden:

```bash
# Promotionskandidaten in der Vorschau anzeigen
openclaw memory promote

# Promotionen auf MEMORY.md anwenden
openclaw memory promote --apply

# Anzahl der Vorschauergebnisse begrenzen
openclaw memory promote --limit 5

# Bereits übertragene Einträge einschließen
openclaw memory promote --include-promoted

# Dreaming-Status prüfen
openclaw memory status --deep
```

Siehe [memory CLI](/cli/memory) für die vollständige Referenz der Flags.

## Dreams-UI

Wenn Dreaming aktiviert ist, zeigt die Gateway-Seitenleiste einen Tab **Dreams** mit
Gedächtnisstatistiken (Kurzzeitanzahl, Langzeitanzahl, Anzahl übertragener Einträge) und der Zeit
des nächsten geplanten Zyklus.

## Weiterführende Informationen

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Konfigurationsreferenz für Memory](/reference/memory-config)
