---
read_when:
    - Überprüfung der Sicherheitslage oder von Bedrohungsszenarien
    - Arbeit an Sicherheitsfeatures oder Audit-Antworten
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T12:56:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# OpenClaw-Bedrohungsmodell v1.0

## MITRE-ATLAS-Framework

**Version:** 1.0-draft
**Zuletzt aktualisiert:** 2026-02-04
**Methodik:** MITRE ATLAS + Datenflussdiagramme
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Quellenangabe zum Framework

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/), dem branchenüblichen Standard-Framework zur Dokumentation gegnerischer Bedrohungen für KI-/ML-Systeme. ATLAS wird von [MITRE](https://www.mitre.org/) in Zusammenarbeit mit der KI-Sicherheits-Community gepflegt.

**Wichtige ATLAS-Ressourcen:**

- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Taktiken](https://atlas.mitre.org/tactics/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

### Zu diesem Bedrohungsmodell beitragen

Dies ist ein lebendes Dokument, das von der OpenClaw-Community gepflegt wird. Siehe [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) für Richtlinien zum Beitragen:

- Neue Bedrohungen melden
- Bestehende Bedrohungen aktualisieren
- Angriffsketten vorschlagen
- Gegenmaßnahmen vorschlagen

---

## 1. Einführung

### 1.1 Zweck

Dieses Bedrohungsmodell dokumentiert gegnerische Bedrohungen für die OpenClaw-KI-Agent-Plattform und den ClawHub-Skills-Marketplace unter Verwendung des MITRE-ATLAS-Frameworks, das speziell für KI-/ML-Systeme entwickelt wurde.

### 1.2 Geltungsbereich

| Komponente             | Enthalten | Hinweise                                          |
| ---------------------- | --------- | ------------------------------------------------- |
| OpenClaw-Agent-Runtime | Ja        | Kern-Agent-Ausführung, Tool-Aufrufe, Sitzungen    |
| Gateway                | Ja        | Authentifizierung, Routing, Channel-Integration   |
| Channel-Integrationen  | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.   |
| ClawHub Marketplace    | Ja        | Skill-Veröffentlichung, Moderation, Verteilung    |
| MCP-Server             | Ja        | Externe Tool-Provider                             |
| Benutzergeräte         | Teilweise | Mobile Apps, Desktop-Clients                      |

### 1.3 Außerhalb des Geltungsbereichs

Nichts ist für dieses Bedrohungsmodell ausdrücklich außerhalb des Geltungsbereichs.

---

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

```
┌─────────────────────────────────────────────────────────────────┐
│                    NICHT VERTRAUENSWÜRDIGE ZONE                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERTRAUENSGRENZE 1: Channel-Zugriff                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Gerätekopplung (1 h DM / 5 min Node-Gnadenfrist)      │   │
│  │  • AllowFrom-/AllowList-Validierung                      │   │
│  │  • Token-/Passwort-/Tailscale-Authentifizierung          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            VERTRAUENSGRENZE 2: Sitzungsisolierung               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT-SITZUNGEN                         │   │
│  │  • Sitzungsschlüssel = agent:channel:peer                │   │
│  │  • Tool-Richtlinien pro Agent                            │   │
│  │  • Transkriptprotokollierung                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             VERTRAUENSGRENZE 3: Tool-Ausführung                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AUSFÜHRUNGS-SANDBOX                      │   │
│  │  • Docker-Sandbox ODER Host (exec-approvals)             │   │
│  │  • Node-Remote-Ausführung                                │   │
│  │  • SSRF-Schutz (DNS-Pinning + IP-Blockierung)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            VERTRAUENSGRENZE 4: Externe Inhalte                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            ABGERUFENE URLs / E-MAILS / WEBHOOKS          │   │
│  │  • Wrapping externer Inhalte (XML-Tags)                  │   │
│  │  • Einfügung von Sicherheitshinweisen                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             VERTRAUENSGRENZE 5: Lieferkette                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill-Veröffentlichung (semver, SKILL.md erforderlich)│   │
│  │  • Musterbasierte Moderations-Flags                      │   │
│  │  • VirusTotal-Scans (demnächst)                          │   │
│  │  • Überprüfung des Alters von GitHub-Konten              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Datenflüsse

| Flow | Quelle  | Ziel        | Daten             | Schutz                 |
| ---- | ------- | ----------- | ----------------- | ---------------------- |
| F1   | Channel | Gateway     | Benutzernachrichten | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Geroutete Nachrichten | Sitzungsisolierung |
| F3   | Agent   | Tools       | Tool-Aufrufe      | Richtliniendurchsetzung |
| F4   | Agent   | Extern      | web_fetch-Requests | SSRF-Blockierung     |
| F5   | ClawHub | Agent       | Skill-Code        | Moderation, Scanning |
| F6   | Agent   | Channel     | Antworten         | Ausgabefilterung     |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Erkennung von Agent-Endpunkten

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Active Scanning                                          |
| **Beschreibung**        | Angreifer scannt nach exponierten OpenClaw-Gateway-Endpunkten        |
| **Angriffsvektor**      | Netzwerkscans, Shodan-Abfragen, DNS-Aufzählung                       |
| **Betroffene Komponenten** | Gateway, exponierte API-Endpunkte                                |
| **Aktuelle Gegenmaßnahmen** | Tailscale-Authentifizierungsoption, standardmäßig an Loopback gebunden |
| **Restrisiko**          | Mittel - Öffentliche Gateways auffindbar                             |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Rate Limiting für Discovery-Endpunkte hinzufügen |

#### T-RECON-002: Sondierung von Channel-Integrationen

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Active Scanning                                          |
| **Beschreibung**        | Angreifer sondiert Messaging-Channels, um KI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**      | Testnachrichten senden, Antwortmuster beobachten                     |
| **Betroffene Komponenten** | Alle Channel-Integrationen                                       |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                               |
| **Restrisiko**          | Niedrig - Begrenzter Nutzen durch reine Erkennung                    |
| **Empfehlungen**        | Randomisierung der Antwortzeiten erwägen                             |

---

### 3.2 Initialzugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Kopplungscodes

| Attribut                | Wert                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                                                                       |
| **Beschreibung**        | Angreifer fängt während der Gnadenfrist für die Kopplung den Kopplungscode ab (1 h für DM-Channel-Kopplung, 5 min für Node-Kopplung) |
| **Angriffsvektor**      | Shoulder Surfing, Netzwerksniffing, Social Engineering                                                          |
| **Betroffene Komponenten** | Gerätekopplungssystem                                                                                        |
| **Aktuelle Gegenmaßnahmen** | Ablauf nach 1 h (DM-Kopplung) / 5 min (Node-Kopplung), Codes werden über bestehenden Channel gesendet     |
| **Restrisiko**          | Mittel - Gnadenfrist ausnutzbar                                                                                 |
| **Empfehlungen**        | Gnadenfrist verkürzen, Bestätigungsschritt hinzufügen                                                           |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                                    |
| **Beschreibung**        | Angreifer fälscht im Channel eine erlaubte Absenderidentität                 |
| **Angriffsvektor**      | Abhängig vom Channel - Spoofing von Telefonnummern, Nachahmung von Benutzernamen |
| **Betroffene Komponenten** | AllowFrom-Validierung pro Channel                                         |
| **Aktuelle Gegenmaßnahmen** | Channelspezifische Identitätsprüfung                                     |
| **Restrisiko**          | Mittel - Einige Channels anfällig für Spoofing                               |
| **Empfehlungen**        | Channelspezifische Risiken dokumentieren, kryptografische Verifikation hinzufügen, wo möglich |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                          |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                     |
| **Beschreibung**        | Angreifer stiehlt Authentifizierungs-Token aus Konfigurationsdateien |
| **Angriffsvektor**      | Malware, unbefugter Gerätezugriff, Offenlegung durch Konfigurations-Backups |
| **Betroffene Komponenten** | `~/.openclaw/credentials/`, Konfigurationsspeicher         |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                        |
| **Restrisiko**          | Hoch - Token werden im Klartext gespeichert                   |
| **Empfehlungen**        | Verschlüsselung ruhender Token implementieren, Token-Rotation hinzufügen |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt Injection

| Attribut                | Wert                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                                |
| **Beschreibung**        | Angreifer sendet gestaltete Prompts, um das Verhalten des Agenten zu manipulieren           |
| **Angriffsvektor**      | Channel-Nachrichten mit gegnerischen Anweisungen                                            |
| **Betroffene Komponenten** | Agent-LLM, alle Eingabeoberflächen                                                       |
| **Aktuelle Gegenmaßnahmen** | Mustererkennung, Wrapping externer Inhalte                                              |
| **Restrisiko**          | Kritisch - Nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen dies              |
| **Empfehlungen**        | Mehrschichtige Verteidigung, Ausgabeverifikation, Benutzerbestätigung für sensible Aktionen implementieren |

#### T-EXEC-002: Indirekte Prompt Injection

| Attribut                | Wert                                                         |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect               |
| **Beschreibung**        | Angreifer bettet bösartige Anweisungen in abgerufene Inhalte ein |
| **Angriffsvektor**      | Bösartige URLs, vergiftete E-Mails, kompromittierte Webhooks |
| **Betroffene Komponenten** | `web_fetch`, E-Mail-Ingestion, externe Datenquellen       |
| **Aktuelle Gegenmaßnahmen** | Inhalts-Wrapping mit XML-Tags und Sicherheitshinweis      |
| **Restrisiko**          | Hoch - LLM kann Wrapper-Anweisungen ignorieren               |
| **Empfehlungen**        | Inhaltsbereinigung, getrennte Ausführungskontexte implementieren |

#### T-EXEC-003: Einschleusen von Tool-Argumenten

| Attribut                | Wert                                                           |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                   |
| **Beschreibung**        | Angreifer manipuliert Tool-Argumente durch Prompt Injection    |
| **Angriffsvektor**      | Gestaltete Prompts, die Parameterwerte von Tools beeinflussen  |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                           |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen für gefährliche Befehle                  |
| **Restrisiko**          | Hoch - Verlass auf Benutzerurteil                              |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe implementieren |

#### T-EXEC-004: Umgehung von Exec-Genehmigungen

| Attribut                | Wert                                                         |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                           |
| **Beschreibung**        | Angreifer konstruiert Befehle, die die Genehmigungs-Allowlist umgehen |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation |
| **Betroffene Komponenten** | `exec-approvals.ts`, Befehls-Allowlist                    |
| **Aktuelle Gegenmaßnahmen** | Allowlist + Fragemodus                                    |
| **Restrisiko**          | Hoch - Keine Befehlsbereinigung                              |
| **Empfehlungen**        | Befehlsnormalisierung implementieren, Blocklist erweitern    |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines bösartigen Skills

| Attribut                | Wert                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                       |
| **Beschreibung**        | Angreifer veröffentlicht einen bösartigen Skill auf ClawHub                |
| **Angriffsvektor**      | Konto erstellen, Skill mit verstecktem bösartigem Code veröffentlichen     |
| **Betroffene Komponenten** | ClawHub, Skill-Laden, Agent-Ausführung                                  |
| **Aktuelle Gegenmaßnahmen** | Überprüfung des Alters von GitHub-Konten, musterbasierte Moderations-Flags |
| **Restrisiko**          | Kritisch - Kein Sandboxing, begrenzte Prüfung                              |
| **Empfehlungen**        | VirusTotal-Integration (in Arbeit), Skill-Sandboxing, Community-Review     |

#### T-PERSIST-002: Vergiftung von Skill-Updates

| Attribut                | Wert                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software             |
| **Beschreibung**        | Angreifer kompromittiert einen beliebten Skill und pusht ein bösartiges Update |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering gegen den Skill-Eigentümer |
| **Betroffene Komponenten** | ClawHub-Versionierung, Auto-Update-Flows                      |
| **Aktuelle Gegenmaßnahmen** | Versions-Fingerprinting                                      |
| **Restrisiko**          | Hoch - Auto-Updates könnten bösartige Versionen übernehmen       |
| **Empfehlungen**        | Update-Signierung, Rollback-Fähigkeit, Version Pinning implementieren |

#### T-PERSIST-003: Manipulation der Agent-Konfiguration

| Attribut                | Wert                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Supply Chain Compromise: Data                    |
| **Beschreibung**        | Angreifer verändert die Agent-Konfiguration, um Zugriff dauerhaft zu erhalten |
| **Angriffsvektor**      | Modifikation von Konfigurationsdateien, Einschleusen von Einstellungen |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                         |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                           |
| **Restrisiko**          | Mittel - Erfordert lokalen Zugriff                               |
| **Empfehlungen**        | Integritätsprüfung der Konfiguration, Audit-Logging für Konfigurationsänderungen |

---

### 3.5 Umgehung von Schutzmaßnahmen (AML.TA0007)

#### T-EVADE-001: Umgehung von Moderationsmustern

| Attribut                | Wert                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                                       |
| **Beschreibung**        | Angreifer gestaltet Skill-Inhalte so, dass sie Moderationsmuster umgehen |
| **Angriffsvektor**      | Unicode-Homoglyphen, Encoding-Tricks, dynamisches Laden                  |
| **Betroffene Komponenten** | `ClawHub moderation.ts`                                               |
| **Aktuelle Gegenmaßnahmen** | Musterbasierte `FLAG_RULES`                                           |
| **Restrisiko**          | Hoch - Einfache Regex leicht zu umgehen                                  |
| **Empfehlungen**        | Verhaltensanalyse hinzufügen (VirusTotal Code Insight), AST-basierte Erkennung |

#### T-EVADE-002: Ausbruch aus dem Inhalts-Wrapper

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Craft Adversarial Data                          |
| **Beschreibung**        | Angreifer gestaltet Inhalte, die aus dem XML-Wrapper-Kontext ausbrechen |
| **Angriffsvektor**      | Tag-Manipulation, Kontextverwirrung, Übersteuerung von Anweisungen |
| **Betroffene Komponenten** | Wrapping externer Inhalte                                 |
| **Aktuelle Gegenmaßnahmen** | XML-Tags + Sicherheitshinweis                             |
| **Restrisiko**          | Mittel - Neue Escape-Techniken werden regelmäßig entdeckt   |
| **Empfehlungen**        | Mehrere Wrapper-Ebenen, ausgabeseitige Validierung          |

---

### 3.6 Erkundung (AML.TA0008)

#### T-DISC-001: Aufzählung von Tools

| Attribut                | Wert                                                     |
| ----------------------- | -------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                |
| **Beschreibung**        | Angreifer zählt durch Prompting verfügbare Tools auf     |
| **Angriffsvektor**      | Abfragen im Stil von „Welche Tools hast du?“             |
| **Betroffene Komponenten** | Agent-Tool-Registry                                    |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                     |
| **Restrisiko**          | Niedrig - Tools sind generell dokumentiert               |
| **Empfehlungen**        | Sichtbarkeitskontrollen für Tools erwägen                |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut                | Wert                                                     |
| ----------------------- | -------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - AI Model Inference API Access                |
| **Beschreibung**        | Angreifer extrahiert sensible Daten aus dem Sitzungskontext |
| **Angriffsvektor**      | Abfragen wie „Was haben wir besprochen?“, Sondierung des Kontexts |
| **Betroffene Komponenten** | Sitzungs-Transkripte, Kontextfenster                  |
| **Aktuelle Gegenmaßnahmen** | Sitzungsisolierung pro Absender                        |
| **Restrisiko**          | Mittel - Daten innerhalb einer Sitzung zugänglich        |
| **Empfehlungen**        | Bereinigung sensibler Daten im Kontext implementieren    |

---

### 3.7 Sammlung und Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut                | Wert                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Collection                                                |
| **Beschreibung**        | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**      | Prompt Injection veranlasst den Agenten, Daten per POST an den Server des Angreifers zu senden |
| **Betroffene Komponenten** | `web_fetch`-Tool                                                  |
| **Aktuelle Gegenmaßnahmen** | SSRF-Blockierung für interne Netzwerke                            |
| **Restrisiko**          | Hoch - Externe URLs sind erlaubt                                     |
| **Empfehlungen**        | URL-Allowlisting, Bewusstsein für Datenklassifizierung implementieren |

#### T-EXFIL-002: Unbefugtes Senden von Nachrichten

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0009 - Collection                                             |
| **Beschreibung**        | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**      | Prompt Injection veranlasst den Agenten, dem Angreifer eine Nachricht zu senden |
| **Betroffene Komponenten** | Nachrichtentool, Channel-Integrationen                          |
| **Aktuelle Gegenmaßnahmen** | Gating für ausgehende Nachrichten                              |
| **Restrisiko**          | Mittel - Gating könnte umgangen werden                            |
| **Empfehlungen**        | Explizite Bestätigung für neue Empfänger verlangen                 |

#### T-EXFIL-003: Ernte von Zugangsdaten

| Attribut                | Wert                                                      |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Collection                                    |
| **Beschreibung**        | Bösartiger Skill sammelt Zugangsdaten aus dem Agent-Kontext |
| **Angriffsvektor**      | Skill-Code liest Umgebungsvariablen, Konfigurationsdateien |
| **Betroffene Komponenten** | Skill-Ausführungsumgebung                              |
| **Aktuelle Gegenmaßnahmen** | Keine speziell für Skills                               |
| **Restrisiko**          | Kritisch - Skills laufen mit Agent-Berechtigungen         |
| **Empfehlungen**        | Skill-Sandboxing, Isolierung von Zugangsdaten             |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut                | Wert                                                  |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity                  |
| **Beschreibung**        | Angreifer führt beliebige Befehle auf dem Benutzersystem aus |
| **Angriffsvektor**      | Prompt Injection kombiniert mit Umgehung der Exec-Genehmigung |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                        |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen, optionale Docker-Sandbox       |
| **Restrisiko**          | Kritisch - Host-Ausführung ohne Sandbox               |
| **Empfehlungen**        | Standardmäßig Sandbox verwenden, UX für Genehmigungen verbessern |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut                | Wert                                                 |
| ----------------------- | ---------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity                 |
| **Beschreibung**        | Angreifer erschöpft API-Guthaben oder Rechenressourcen |
| **Angriffsvektor**      | Automatisierte Nachrichtenflutung, teure Tool-Aufrufe |
| **Betroffene Komponenten** | Gateway, Agent-Sitzungen, API-Provider            |
| **Aktuelle Gegenmaßnahmen** | Keine                                              |
| **Restrisiko**          | Hoch - Kein Rate Limiting                             |
| **Empfehlungen**        | Rate Limits pro Absender, Kostenbudgets implementieren |

#### T-IMPACT-003: Imageschaden

| Attribut                | Wert                                                      |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Erode AI Model Integrity                      |
| **Beschreibung**        | Angreifer veranlasst den Agenten, schädliche/beleidigende Inhalte zu senden |
| **Angriffsvektor**      | Prompt Injection verursacht unangemessene Antworten       |
| **Betroffene Komponenten** | Ausgabeerzeugung, Channel-Messaging                    |
| **Aktuelle Gegenmaßnahmen** | Inhaltsrichtlinien des LLM-Providers                    |
| **Restrisiko**          | Mittel - Provider-Filter sind nicht perfekt               |
| **Empfehlungen**        | Ausgabefilter-Ebene, Benutzerkontrollen                   |

---

## 4. Analyse der ClawHub-Lieferkette

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrolle             | Implementierung             | Wirksamkeit                                          |
| --------------------- | --------------------------- | ---------------------------------------------------- |
| Alter des GitHub-Kontos | `requireGitHubAccountAge()` | Mittel - Erhöht die Hürde für neue Angreifer       |
| Pfadbereinigung       | `sanitizePath()`            | Hoch - Verhindert Path Traversal                     |
| Dateitypvalidierung   | `isTextFile()`              | Mittel - Nur Textdateien, können aber dennoch bösartig sein |
| Größenlimits          | 50 MB Gesamt-Bundle         | Hoch - Verhindert Ressourcenerschöpfung              |
| Erforderliche `SKILL.md` | Verpflichtende Readme    | Geringer Sicherheitswert - Nur informativ            |
| Mustermoderation      | `FLAG_RULES` in `moderation.ts` | Niedrig - Leicht zu umgehen                      |
| Moderationsstatus     | Feld `moderationStatus`     | Mittel - Manuelle Prüfung möglich                    |

### 4.2 Muster für Moderations-Flags

Aktuelle Muster in `moderation.ts`:

```javascript
// Bekannt schädliche Identifikatoren
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Verdächtige Schlüsselwörter
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Einschränkungen:**

- Prüft nur Slug, `displayName`, `summary`, Frontmatter, Metadaten und Dateipfade
- Analysiert nicht den tatsächlichen Skill-Code-Inhalt
- Einfache Regex leicht durch Verschleierung zu umgehen
- Keine Verhaltensanalyse

### 4.3 Geplante Verbesserungen

| Verbesserung           | Status                                | Auswirkung                                                           |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| VirusTotal-Integration | In Bearbeitung                        | Hoch - Verhaltensanalyse mit Code Insight                            |
| Community-Meldungen    | Teilweise (`skillReports`-Tabelle existiert) | Mittel                                                        |
| Audit-Logging          | Teilweise (`auditLogs`-Tabelle existiert) | Mittel                                                          |
| Badge-System           | Implementiert                         | Mittel - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit vs. Auswirkung

| Threat ID     | Wahrscheinlichkeit | Auswirkung | Risikostufe  | Priorität |
| ------------- | ------------------ | ---------- | ------------ | --------- |
| T-EXEC-001    | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-PERSIST-001 | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-EXFIL-003   | Mittel             | Kritisch   | **Kritisch** | P0        |
| T-IMPACT-001  | Mittel             | Kritisch   | **Hoch**     | P1        |
| T-EXEC-002    | Hoch               | Hoch       | **Hoch**     | P1        |
| T-EXEC-004    | Mittel             | Hoch       | **Hoch**     | P1        |
| T-ACCESS-003  | Mittel             | Hoch       | **Hoch**     | P1        |
| T-EXFIL-001   | Mittel             | Hoch       | **Hoch**     | P1        |
| T-IMPACT-002  | Hoch               | Mittel     | **Hoch**     | P1        |
| T-EVADE-001   | Hoch               | Mittel     | **Mittel**   | P2        |
| T-ACCESS-001  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-ACCESS-002  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-PERSIST-002 | Niedrig            | Hoch       | **Mittel**   | P2        |

### 5.2 Kritische Angriffsketten

**Angriffskette 1: Skill-basierter Datendiebstahl**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Bösartigen Skill veröffentlichen) → (Moderation umgehen) → (Zugangsdaten ernten)
```

**Angriffskette 2: Prompt Injection zu RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt einschleusen) → (Exec-Genehmigung umgehen) → (Befehle ausführen)
```

**Angriffskette 3: Indirekte Injection über abgerufene Inhalte**

```
T-EXEC-002 → T-EXFIL-001 → Externe Exfiltration
(URL-Inhalt vergiften) → (Agent ruft ab & folgt Anweisungen) → (Daten werden an Angreifer gesendet)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofort (P0)

| ID    | Empfehlung                                   | Adressiert                 |
| ----- | -------------------------------------------- | -------------------------- |
| R-001 | VirusTotal-Integration abschließen           | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skill-Sandboxing implementieren              | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabeverifikation für sensible Aktionen hinzufügen | T-EXEC-001, T-EXEC-002 |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                                  | Adressiert   |
| ----- | ------------------------------------------- | ------------ |
| R-004 | Rate Limiting implementieren                | T-IMPACT-002 |
| R-005 | Verschlüsselung ruhender Token hinzufügen   | T-ACCESS-003 |
| R-006 | UX und Validierung für Exec-Genehmigungen verbessern | T-EXEC-004 |
| R-007 | URL-Allowlisting für `web_fetch` implementieren | T-EXFIL-001 |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                            | Adressiert    |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Kryptografische Channel-Verifikation hinzufügen, wo möglich | T-ACCESS-002 |
| R-009 | Integritätsprüfung der Konfiguration implementieren   | T-PERSIST-003 |
| R-010 | Update-Signierung und Version Pinning hinzufügen      | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 Zuordnung zu ATLAS-Techniken

| ATLAS-ID      | Name der Technik               | OpenClaw-Bedrohungen                                               |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                      |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                         |

### 7.2 Wichtige Sicherheitsdateien

| Pfad                                | Zweck                        | Risikostufe  |
| ----------------------------------- | ---------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Befehlsgenehmigungen | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung    | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                  | **Kritisch** |
| `src/security/external-content.ts`  | Schutz vor Prompt Injection  | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Durchsetzung von Tool-Richtlinien | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolierung           | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITREs Adversarial Threat Landscape for AI Systems        |
| **ClawHub**          | OpenClaws Skills-Marketplace                              |
| **Gateway**          | OpenClaws Schicht für Nachrichtenrouting und Authentifizierung |
| **MCP**              | Model Context Protocol - Schnittstelle für Tool-Provider  |
| **Prompt Injection** | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet sind |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten          |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Dieses Bedrohungsmodell ist ein lebendes Dokument. Melden Sie Sicherheitsprobleme an security@openclaw.ai_
