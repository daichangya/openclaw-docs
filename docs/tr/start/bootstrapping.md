---
read_when:
    - İlk ajan çalıştırmasında neler olduğunu anlama
    - Önyükleme dosyalarının nerede bulunduğunu açıklama
    - İlk kurulum kimlik ayarını ayıklama
sidebarTitle: Bootstrapping
summary: Çalışma alanını ve kimlik dosyalarını tohumlayan ajan önyükleme ritüeli
title: Ajan önyükleme
x-i18n:
    generated_at: "2026-04-25T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

Önyükleme, bir ajan çalışma alanını hazırlayan ve
kimlik ayrıntılarını toplayan **ilk çalıştırma** ritüelidir. İlk kurulumdan sonra, ajan
ilk kez başladığında gerçekleşir.

## Önyükleme ne yapar

İlk ajan çalıştırmasında OpenClaw çalışma alanını (varsayılan
`~/.openclaw/workspace`) önyükler:

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` dosyalarını tohumlar.
- Kısa bir soru-cevap ritüeli çalıştırır (her seferinde bir soru).
- Kimlik + tercihleri `IDENTITY.md`, `USER.md`, `SOUL.md` dosyalarına yazar.
- Bittiğinde `BOOTSTRAP.md` dosyasını kaldırır; böylece yalnızca bir kez çalışır.

## Önyüklemeyi atlama

Önceden tohumlanmış bir çalışma alanı için bunu atlamak üzere `openclaw onboard --skip-bootstrap` çalıştırın.

## Nerede çalışır

Önyükleme her zaman **gateway host** üzerinde çalışır. macOS uygulaması
uzak bir Gateway'e bağlanıyorsa, çalışma alanı ve önyükleme dosyaları bu uzak
makinede bulunur.

<Note>
Gateway başka bir makinede çalıştığında, çalışma alanı dosyalarını gateway
host üzerinde düzenleyin (örneğin `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulaması ilk kurulumu: [İlk kurulum](/tr/start/onboarding)
- Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace)
