---
read_when:
    - Konfigurowanie OpenClaw na Hostinger
    - Szukasz zarządzanego VPS dla OpenClaw
    - Korzystanie z 1-Click OpenClaw w Hostinger
summary: Hostowanie OpenClaw na Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T10:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Uruchom trwały Gateway OpenClaw na [Hostinger](https://www.hostinger.com/openclaw) przez zarządzane wdrożenie **1-Click** lub instalację na **VPS**.

## Wymagania wstępne

- Konto Hostinger ([rejestracja](https://www.hostinger.com/openclaw))
- Około 5–10 minut

## Opcja A: 1-Click OpenClaw

Najszybszy sposób na rozpoczęcie pracy. Hostinger obsługuje infrastrukturę, Docker i automatyczne aktualizacje.

<Steps>
  <Step title="Kup i uruchom">
    1. Na [stronie Hostinger OpenClaw](https://www.hostinger.com/openclaw) wybierz plan Managed OpenClaw i sfinalizuj zakup.

    <Note>
    Podczas finalizacji zakupu możesz wybrać kredyty **Ready-to-Use AI**, które są kupowane z wyprzedzeniem i natychmiast integrowane w OpenClaw — bez potrzeby posiadania zewnętrznych kont ani kluczy API od innych providerów. Możesz od razu zacząć czatować. Alternatywnie podczas konfiguracji podaj własny klucz od Anthropic, OpenAI, Google Gemini lub xAI.
    </Note>

  </Step>

  <Step title="Wybierz kanał wiadomości">
    Wybierz jeden lub więcej kanałów do połączenia:

    - **WhatsApp** — zeskanuj kod QR pokazany w kreatorze konfiguracji.
    - **Telegram** — wklej token bota z [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Dokończ instalację">
    Kliknij **Finish**, aby wdrożyć instancję. Gdy będzie gotowa, uzyskaj dostęp do panelu OpenClaw z poziomu **OpenClaw Overview** w hPanel.
  </Step>

</Steps>

## Opcja B: OpenClaw na VPS

Większa kontrola nad serwerem. Hostinger wdraża OpenClaw przez Docker na Twoim VPS, a Ty zarządzasz nim przez **Docker Manager** w hPanel.

<Steps>
  <Step title="Kup VPS">
    1. Na [stronie Hostinger OpenClaw](https://www.hostinger.com/openclaw) wybierz plan OpenClaw on VPS i sfinalizuj zakup.

    <Note>
    Podczas finalizacji zakupu możesz wybrać kredyty **Ready-to-Use AI** — są kupowane z wyprzedzeniem i natychmiast integrowane w OpenClaw, dzięki czemu możesz zacząć czatować bez zewnętrznych kont ani kluczy API od innych providerów.
    </Note>

  </Step>

  <Step title="Skonfiguruj OpenClaw">
    Gdy VPS zostanie przygotowany, wypełnij pola konfiguracji:

    - **Gateway token** — generowany automatycznie; zapisz go do późniejszego użycia.
    - **Numer WhatsApp** — Twój numer z kodem kraju (opcjonalnie).
    - **Token bota Telegram** — z [BotFather](https://t.me/BotFather) (opcjonalnie).
    - **Klucze API** — potrzebne tylko wtedy, gdy podczas zakupu nie wybrano kredytów Ready-to-Use AI.

  </Step>

  <Step title="Uruchom OpenClaw">
    Kliknij **Deploy**. Gdy wszystko będzie działać, otwórz panel OpenClaw z hPanel, klikając **Open**.
  </Step>

</Steps>

Logami, restartami i aktualizacjami zarządza się bezpośrednio z interfejsu Docker Manager w hPanel. Aby zaktualizować, naciśnij **Update** w Docker Manager, a zostanie pobrany najnowszy obraz.

## Zweryfikuj konfigurację

Wyślij „Hi” do swojego asystenta na podłączonym kanale. OpenClaw odpowie i przeprowadzi Cię przez początkowe preferencje.

## Rozwiązywanie problemów

**Panel się nie ładuje** — Poczekaj kilka minut, aż kontener zakończy provisioning. Sprawdź logi Docker Manager w hPanel.

**Kontener Docker stale się restartuje** — Otwórz logi Docker Manager i poszukaj błędów konfiguracji (brakujące tokeny, nieprawidłowe klucze API).

**Bot Telegram nie odpowiada** — Wyślij wiadomość z kodem parowania z Telegram bezpośrednio jako wiadomość na czacie OpenClaw, aby zakończyć połączenie.

## Następne kroki

- [Kanały](/pl/channels) — połącz Telegram, WhatsApp, Discord i inne
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie opcje konfiguracji
