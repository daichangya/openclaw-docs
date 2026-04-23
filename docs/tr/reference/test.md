---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testler yerelde nasıl çalıştırılır (`vitest`) ve force/coverage modları ne zaman kullanılmalıdır
title: Testler
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Testler

- Tam test kiti (suite’ler, canlı, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan takılı kalmış Gateway süreçlerini sonlandırır, ardından sunucu testlerinin çalışan bir örnekle çakışmaması için yalıtılmış bir Gateway portuyla tam Vitest suite’ini çalıştırır. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktıysa bunu kullanın.
- `pnpm test:coverage`: Birim suite’ini V8 coverage ile (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, depo genelinde tüm dosyaları kapsayan bir coverage kapısı değil, yüklenen dosyalara yönelik birim coverage kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70, branch’ler için %55’tir. `coverage.all` false olduğu için kapı, bölünmüş lane kaynak dosyalarının tamamını kapsanmamış saymak yerine birim coverage suite’i tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` ile kıyaslandığında değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: Diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını kapsamlı Vitest lane’lerine genişletir. Yapılandırma/kurulum değişiklikleri ise yerel root project çalıştırmasına geri düşer; böylece bağlantı düzenlemeleri gerektiğinde daha geniş yeniden çalıştırılır.
- `pnpm changed:lanes`: `origin/main` karşısındaki diff’in tetiklediği mimari lane’leri gösterir.
- `pnpm check:changed`: `origin/main` karşısındaki diff için akıllı değişenler kapısını çalıştırır. Çekirdek değişiklikleri çekirdek test lane’leriyle, extension çalışmalarını extension test lane’leriyle, yalnızca test değişikliklerini sadece test typecheck/testleriyle çalıştırır; genel Plugin SDK veya plugin-contract değişikliklerini extension doğrulamasına genişletir ve sürüm metadatasına yönelik değişikliklerde hedefli sürüm/yapılandırma/root bağımlılığı kontrollerini korur.
- `pnpm test`: Açıkça belirtilen dosya/dizin hedeflerini kapsamlı Vitest lane’leri üzerinden yönlendirir. Hedef belirtilmeyen çalıştırmalar sabit shard grupları kullanır ve yerel paralel çalıştırma için leaf config’lere genişler; extension grubu her zaman tek büyük bir root-project süreci yerine extension başına shard config’lerine genişler.
- Tam ve extension shard çalıştırmaları yerel zamanlama verisini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki çalıştırmalar bu zamanlamaları yavaş ve hızlı shard’ları dengelemek için kullanır. Yerel zamanlama artifact’ını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan özel hafif lane’ler üzerinden yönlendirilir; çalışma zamanı açısından ağır durumlar mevcut lane’lerinde kalır.
- Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da `pnpm test:changed` komutunu bu hafif lane’lerdeki açık kardeş testlere eşler; böylece küçük yardımcı düzenlemeleri, çalışma zamanı destekli ağır suite’lerin yeniden çalıştırılmasını önler.
- `auto-reply` artık üç özel config’e de ayrılır (`core`, `top-level`, `reply`); böylece reply harness daha hafif üst düzey durum/token/helper testlerine baskın gelmez.
- Temel Vitest config artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış runner depo genelindeki config’lerde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions` tüm extension/plugin shard’larını çalıştırır. Ağır kanal extension’ları ve OpenAI özel shard’lar olarak çalışır; diğer extension grupları toplu kalır. Tek bir paketlenmiş plugin lane’i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için yine kapsamlı lane yönlendirmesini kullanırken Vitest import süresi + import dökümü raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: Aynı import profillemesi, ancak yalnızca `origin/main` ile kıyaslandığında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: Aynı commit edilmiş git diff’i için yönlendirilmiş changed-mode yolunu yerel root-project çalıştırmasıyla kıyaslar.
- `pnpm test:perf:changed:bench -- --worktree`: Mevcut worktree değişiklik kümesini önce commit etmeden kıyaslar.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim runner için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı olarak etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çoklu örnek WS/HTTP/Node eşleştirmesi). Varsayılan olarak `vitest.e2e.config.ts` içinde `threads` + `isolate: false` ve uyarlanabilir worker’lar kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı loglar için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı canlı testlerini çalıştırır (minimax/zai). Atlanmaması için API anahtarları ve `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı test imajını ve Docker E2E imajını bir kez oluşturur, ardından Docker smoke lane’lerini varsayılan olarak eşzamanlılık 4 ile `OPENCLAW_SKIP_DOCKER_BUILD=1` kullanarak çalıştırır. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` ile ayarlayın. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadığı sürece çalıştırıcı ilk hatadan sonra havuzlanmış yeni lane planlamayı durdurur ve her lane için `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile değiştirilebilen 120 dakikalık bir zaman aşımı vardır. Başlangıca veya sağlayıcıya duyarlı lane’ler paralel havuzdan sonra tek başına çalışır. Lane başına loglar `.artifacts/docker-tests/<run-id>/` altına yazılır.
- `pnpm test:docker:openwebui`: Docker üzerinde çalışan OpenClaw + Open WebUI’ı başlatır, Open WebUI üzerinden oturum açar, `/api/models` yolunu kontrol eder, ardından `/api/chat/completions` üzerinden gerçek bir proxy’lenmiş sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI imajı çeker ve normal birim/e2e suite’leri gibi CI açısından kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway container’ı ve `openclaw mcp serve` başlatan ikinci bir istemci container’ı çalıştırır; ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek metadata’sını, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP karelerini doğrudan okur; böylece smoke testi köprünün gerçekten ne yaydığını yansıtır.

## Yerel PR kapısı

PR birleştirme/kapı kontrollerini yerelde çalıştırmak için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Eğer `pnpm test` yüklü bir host üzerinde takılmalı biçimde başarısız olursa, bunu regresyon saymadan önce bir kez daha çalıştırın; ardından `pnpm test <path/to/test>` ile izole edin. Bellek kısıtlı host’lar için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikmesi kıyaslaması (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (min 1114, maks 2431)
- opus medyan 2454ms (min 1224, maks 3170)

## CLI başlangıç kıyaslaması

Betik: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Kullanım:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Ön ayarlar:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: her iki ön ayar da

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/maks, exit-code/signal dağılımı ve maksimum RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, her çalıştırma için V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness’i kullanır.

Kaydedilen çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenmiş smoke artifact’ını `.artifacts/cli-startup-bench-smoke.json` yoluna yazar
- `pnpm test:startup:bench:save`, tam suite artifact’ını `runs=5` ve `warmup=1` ile `.artifacts/cli-startup-bench-all.json` yoluna yazar
- `pnpm test:startup:bench:update`, depoya işlenmiş baseline fixture’ını `runs=5` ve `warmup=1` ile `test/fixtures/cli-startup-bench.json` yolunda yeniler

Depoya işlenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile karşılaştırmak için `pnpm test:startup:bench:check` kullanın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca container tabanlı onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux container’ında tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden yürütür, config/workspace/session dosyalarını doğrular, ardından Gateway’i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

`qrcode-terminal` bileşeninin desteklenen Docker Node çalışma zamanlarında yüklendiğini doğrular (varsayılan Node 24, uyumlu Node 22):

```bash
pnpm test:docker:qr
```
