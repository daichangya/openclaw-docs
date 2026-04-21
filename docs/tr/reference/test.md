---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerelde nasıl çalıştıracağınız (vitest) ve force/coverage modlarını ne zaman kullanacağınız
title: Testler
x-i18n:
    generated_at: "2026-04-21T09:05:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Testler

- Tam test araç takımı (suite'ler, canlı, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalıcı bir Gateway sürecini sonlandırır, ardından tam Vitest suite'ini yalıtılmış bir Gateway portuyla çalıştırır; böylece sunucu testleri çalışan bir örnekle çakışmaz. Önceki bir Gateway çalıştırması 18789 portunu meşgul bıraktığında bunu kullanın.
- `pnpm test:coverage`: Birim suite'ini V8 coverage ile çalıştırır (`vitest.unit.config.ts` aracılığıyla). Bu, tüm depo için tüm dosya coverage'ı değil, yüklenen dosyalara dayalı birim coverage geçididir. Eşikler satırlar/fonksiyonlar/ifadeler için %70 ve branch'ler için %55'tir. `coverage.all` false olduğu için geçit, her bölünmüş lane kaynak dosyasını kapsanmamış saymak yerine birim coverage suite'i tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` sonrasında değişen dosyalar için birim coverage çalıştırır.
- `pnpm test:changed`: Diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını kapsamlı Vitest lane'lerine genişletir. Yapılandırma/kurulum değişiklikleri yine yerel kök proje çalıştırmasına geri döner; böylece bağlama düzenlemeleri gerektiğinde geniş yeniden çalıştırılır.
- `pnpm changed:lanes`: `origin/main` karşısındaki diff'in tetiklediği mimari lane'leri gösterir.
- `pnpm check:changed`: `origin/main` karşısındaki diff için akıllı değişen geçidi çalıştırır. Çekirdek işi çekirdek test lane'leriyle, extension işini extension test lane'leriyle, yalnızca test işini yalnızca test typecheck/testlerle çalıştırır ve herkese açık Plugin SDK veya plugin-contract değişikliklerini extension doğrulamasına genişletir.
- `pnpm test`: Açık dosya/dizin hedeflerini kapsamlı Vitest lane'leri üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için yaprak yapılandırmalara genişler; extension grubu her zaman tek dev kök-proje süreci yerine extension başına shard yapılandırmalarına genişler.
- Tam ve extension shard çalıştırmaları yerel zamanlama verisini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki çalıştırmalar bu zamanlamaları yavaş ve hızlı shard'ları dengelemek için kullanır. Yerel zamanlama artifaktını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` tutan ayrılmış hafif lane'ler üzerinden yönlendirilir; çalışma zamanı açısından ağır durumlar mevcut lane'lerinde kalır.
- Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da `pnpm test:changed` komutunu bu hafif lane'lerdeki açık kardeş testlere eşler; böylece küçük yardımcı düzenlemeleri ağır çalışma zamanı destekli suite'lerin yeniden çalışmasını önler.
- `auto-reply` artık üç ayrılmış yapılandırmaya (`core`, `top-level`, `reply`) ayrılır; böylece reply harness daha hafif üst düzey durum/belirteç/yardımcı testlerine baskın gelmez.
- Temel Vitest yapılandırması artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan izole edilmemiş çalıştırıcı depo yapılandırmaları genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm extension/Plugin shard'larını çalıştırır. Ağır kanal extension'ları ve OpenAI ayrılmış shard'lar olarak çalışır; diğer extension grupları toplu kalır. Tek bir paketlenmiş Plugin lane'i için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Vitest içe aktarma süresi + içe aktarma döküm raporlamasını etkinleştirir; açık dosya/dizin hedefleri için yine kapsamlı lane yönlendirmesi kullanır.
- `pnpm test:perf:imports:changed`: Aynı içe aktarma profillemesi, ancak yalnızca `origin/main` sonrasında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` aynı commit edilmiş git diff'i için yönlendirilmiş değişen-mod yolunu yerel kök-proje çalıştırmasına karşı benchmark eder.
- `pnpm test:perf:changed:bench -- --worktree` mevcut worktree değişiklik kümesini önce commit etmeden benchmark eder.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim çalıştırıcı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile açıkça katılın.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çok örnekli WS/HTTP/Node eşleme). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlamalı worker'larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` kullanın.
- `pnpm test:live`: Sağlayıcı canlı testlerini çalıştırır (minimax/zai). Atlamayı kaldırmak için API anahtarları ve `LIVE=1` (veya sağlayıcıya özgü `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:openwebui`: Docker içinde OpenClaw + Open WebUI başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetler, ardından `/api/chat/completions` üzerinden gerçek bir proxy'lenmiş sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içindeki OpenAI), harici bir Open WebUI imajı çeker ve normal birim/e2e suite'leri gibi CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway kapsayıcısı ve `openclaw mcp serve` başlatan ikinci bir istemci kapsayıcısı başlatır; ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verisini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP karelerini doğrudan okur; böylece smoke testi köprünün gerçekten ne yaydığını yansıtır.

## Yerel PR geçidi

Yerel PR indirme/geçit kontrolleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir hostta kararsız çalışırsa, bunu gerileme olarak değerlendirmeden önce bir kez yeniden çalıştırın, ardından `pnpm test <path/to/test>` ile yalıtın. Bellek kısıtlı hostlar için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme benchmark'ı (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan prompt: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

## CLI başlangıç benchmark'ı

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

Preset'ler:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: iki preset birlikte

Çıktı, her komut için `sampleCount`, avg, p50, p95, min/max, exit-code/signal dağılımı ve max RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, çalıştırma başına V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness'i kullanır.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedeflenmiş smoke artifaktını `.artifacts/cli-startup-bench-smoke.json` yoluna yazar
- `pnpm test:startup:bench:save`, tam suite artifaktını `runs=5` ve `warmup=1` kullanarak `.artifacts/cli-startup-bench-all.json` yoluna yazar
- `pnpm test:startup:bench:update`, checked-in baseline fixture'ı `runs=5` ve `warmup=1` kullanarak `test/fixtures/cli-startup-bench.json` yolunda yeniler

Checked-in fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## İlk katılım E2E (Docker)

Docker isteğe bağlıdır; bu yalnızca kapsayıcılaştırılmış ilk katılım smoke testleri için gereklidir.

Temiz bir Linux kapsayıcısında tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik etkileşimli sihirbazı sahte TTY üzerinden sürer, config/workspace/session dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` çalıştırır.

## QR içe aktarma smoke testi (Docker)

`qrcode-terminal` modülünün desteklenen Docker Node çalışma zamanlarında (varsayılan Node 24, uyumlu Node 22) yüklendiğini doğrular:

```bash
pnpm test:docker:qr
```
