---
read_when:
    - Testleri çalıştırma veya düzeltme
summary: Testleri yerelde nasıl çalıştıracağınız (vitest) ve force/coverage modlarını ne zaman kullanmanız gerektiği
title: Testler
x-i18n:
    generated_at: "2026-04-25T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Tam test kiti (paketler, canlı, Docker): [Testing](/tr/help/testing)

- `pnpm test:force`: Varsayılan kontrol portunu tutan kalmış Gateway süreçlerini sonlandırır, ardından tam Vitest paketini yalıtılmış bir Gateway portuyla çalıştırır; böylece sunucu testleri çalışan bir örnekle çakışmaz. Önceki bir Gateway çalıştırması 18789 portunu dolu bıraktıysa bunu kullanın.
- `pnpm test:coverage`: Birim paketini V8 kapsamıyla (`vitest.unit.config.ts` üzerinden) çalıştırır. Bu, depo genelindeki tüm dosyaların kapsamı değil, yüklenen dosyalar için birim kapsam kapısıdır. Eşikler satırlar/fonksiyonlar/ifadeler için %70, dallar için %55'tir. `coverage.all` false olduğu için kapı, bölünmüş paketlerdeki her kaynak dosyayı kapsam dışı saymak yerine birim kapsam paketi tarafından yüklenen dosyaları ölçer.
- `pnpm test:coverage:changed`: Yalnızca `origin/main` ile karşılaştırıldığında değişen dosyalar için birim kapsamı çalıştırır.
- `pnpm test:changed`: Fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını kapsamlı Vitest paketlerine genişletir. Yapılandırma/kurulum değişiklikleri yine yerel kök proje çalıştırmasına geri döner; böylece bağlantı düzenlemeleri gerektiğinde geniş çapta yeniden çalıştırılır.
- `pnpm changed:lanes`: `origin/main` ile karşılaştırılan farkın tetiklediği mimari şeritleri gösterir.
- `pnpm check:changed`: `origin/main` ile karşılaştırılan fark için akıllı değişen-kapısını çalıştırır. Çekirdek işleri çekirdek test şeritleriyle, eklenti işlerini eklenti test şeritleriyle, yalnızca test işlerini yalnızca test typecheck/testleriyle çalıştırır; herkese açık Plugin SDK veya plugin-contract değişikliklerini tek bir eklenti doğrulama geçişine genişletir ve yalnızca sürüm üst verisi olan sürüm artırımlarını hedefli sürüm/yapılandırma/kök bağımlılık denetimlerinde tutar.
- `pnpm test`: Açık dosya/dizin hedeflerini kapsamlı Vitest şeritleri üzerinden yönlendirir. Hedefsiz çalıştırmalar sabit shard grupları kullanır ve yerel paralel yürütme için yaprak yapılandırmalara genişler; eklenti grubu her zaman tek büyük bir kök-proje süreci yerine eklenti başına shard yapılandırmalarına genişler.
- Tam ve eklenti shard çalıştırmaları yerel zamanlama verilerini `.artifacts/vitest-shard-timings.json` içinde günceller; sonraki çalıştırmalar bu zamanlamaları yavaş ve hızlı shard'ları dengelemek için kullanır. Yerel zamanlama yapıtını yok saymak için `OPENCLAW_TEST_PROJECTS_TIMINGS=0` ayarlayın.
- Seçili `plugin-sdk` ve `commands` test dosyaları artık yalnızca `test/setup.ts` dosyasını tutan özel hafif şeritler üzerinden yönlendirilir; çalışma zamanı açısından ağır senaryolar mevcut şeritlerinde kalır.
- Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da `pnpm test:changed` komutunu bu hafif şeritlerdeki açık kardeş testlere eşler; böylece küçük yardımcı düzenlemeleri ağır çalışma zamanı destekli paketleri yeniden çalıştırmaz.
- `auto-reply` artık üç özel yapılandırmaya da ayrılır (`core`, `top-level`, `reply`); böylece reply harness, daha hafif üst düzey durum/token/helper testlerine baskın çıkmaz.
- Temel Vitest yapılandırması artık varsayılan olarak `pool: "threads"` ve `isolate: false` kullanır; paylaşılan yalıtılmamış çalıştırıcı depo yapılandırmaları genelinde etkindir.
- `pnpm test:channels`, `vitest.channels.config.ts` dosyasını çalıştırır.
- `pnpm test:extensions` ve `pnpm test extensions`, tüm eklenti/Plugin shard'larını çalıştırır. Ağır kanal Plugin'leri, tarayıcı Plugin'i ve OpenAI özel shard'lar olarak çalışır; diğer Plugin grupları toplu kalır. Tek bir paketlenmiş Plugin şeridi için `pnpm test extensions/<id>` kullanın.
- `pnpm test:perf:imports`: Açık dosya/dizin hedefleri için yine kapsamlı şerit yönlendirmesi kullanırken Vitest import-duration + import-breakdown raporlamasını etkinleştirir.
- `pnpm test:perf:imports:changed`: Aynı import profilini oluşturur, ancak yalnızca `origin/main` ile karşılaştırıldığında değişen dosyalar için.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: Aynı kaydedilmiş git farkı için yönlendirilmiş changed-mode yolunu yerel kök-proje çalıştırmasıyla kıyaslar.
- `pnpm test:perf:changed:bench -- --worktree`: Önce commit atmadan geçerli çalışma ağacı değişiklik kümesini kıyaslar.
- `pnpm test:perf:profile:main`: Vitest ana iş parçacığı için bir CPU profili yazar (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Birim çalıştırıcı için CPU + heap profilleri yazar (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Her tam paket Vitest yaprak yapılandırmasını seri olarak çalıştırır ve gruplandırılmış süre verilerini yapılandırma başına JSON/günlük yapıtlarıyla birlikte yazar. Test Performance Agent bunu yavaş test düzeltmelerine başlamadan önce temel çizgi olarak kullanır.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Performans odaklı bir değişiklikten sonra gruplandırılmış raporları karşılaştırır.
- Gateway entegrasyonu: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` veya `pnpm test:gateway` ile isteğe bağlı etkinleştirilir.
- `pnpm test:e2e`: Gateway uçtan uca smoke testlerini çalıştırır (çok örnekli WS/HTTP/Node eşleme). Varsayılan olarak `vitest.e2e.config.ts` içinde uyarlanabilir worker'larla `threads` + `isolate: false` kullanır; `OPENCLAW_E2E_WORKERS=<n>` ile ayarlayın ve ayrıntılı günlükler için `OPENCLAW_E2E_VERBOSE=1` ayarlayın.
- `pnpm test:live`: Sağlayıcı canlı testlerini çalıştırır (minimax/zai). API anahtarları ve skip'i kaldırmak için `LIVE=1` (veya sağlayıcıya özel `*_LIVE_TEST=1`) gerekir.
- `pnpm test:docker:all`: Paylaşılan canlı-test imajını ve Docker E2E imajını bir kez oluşturur, ardından Docker smoke şeritlerini ağırlıklı bir zamanlayıcıyla `OPENCLAW_SKIP_DOCKER_BUILD=1` üzerinden çalıştırır. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` süreç yuvalarını denetler ve varsayılanı 10'dur; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` sağlayıcıya duyarlı tail havuzunu denetler ve varsayılanı 10'dur. Ağır şerit sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` olur; sağlayıcı sınırları varsayılan olarak sağlayıcı başına bir ağır şerittir: `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` ve `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Daha büyük ana sistemler için `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` veya `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` kullanın. Yerel Docker daemon create fırtınalarını önlemek için şerit başlangıçları varsayılan olarak 2 saniye aralıklı yapılır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` ile geçersiz kılın. Çalıştırıcı varsayılan olarak Docker'ı ön denetler, eski OpenClaw E2E container'larını temizler, her 30 saniyede etkin şerit durumunu üretir, uyumlu şeritler arasında sağlayıcı CLI araç önbelleklerini paylaşır, geçici canlı-sağlayıcı hatalarını varsayılan olarak bir kez yeniden dener (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), ve daha sonraki çalıştırmalarda en uzundan başlayarak sıralama yapmak için şerit zamanlamalarını `.artifacts/docker-tests/lane-timings.json` içine kaydeder. Docker çalıştırmadan şerit bildirimini yazdırmak için `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, durum çıktısını ayarlamak için `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, veya zamanlama yeniden kullanımını devre dışı bırakmak için `OPENCLAW_DOCKER_ALL_TIMINGS=0` kullanın. Belirlenimli/yerel şeritler için `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` ya da yalnızca canlı-sağlayıcı şeritleri için `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` kullanın; paket takma adları `pnpm test:docker:local:all` ve `pnpm test:docker:live:all` şeklindedir. Yalnızca canlı mod, ana ve tail canlı şeritleri tek bir en-uzun-önce havuzunda birleştirir; böylece sağlayıcı kovaları Claude, Codex ve Gemini işlerini birlikte paketleyebilir. `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ayarlanmadıkça çalıştırıcı ilk hatadan sonra yeni havuzlanmış şeritler planlamayı durdurur ve her şeridin `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık bir yedek zaman aşımı vardır; seçili canlı/tail şeritler daha sıkı şerit başına sınırlar kullanır. CLI backend Docker kurulum komutlarının kendi zaman aşımı vardır: `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (varsayılan 180). Şerit başına günlükler `.artifacts/docker-tests/<run-id>/` altında yazılır.
- CLI backend canlı Docker probları odaklı şeritler olarak çalıştırılabilir; örneğin `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` veya `pnpm test:docker:live-cli-backend:codex:mcp`. Claude ve Gemini için eşleşen `:resume` ve `:mcp` takma adları vardır.
- `pnpm test:docker:openwebui`: Docker içinde çalışan OpenClaw + Open WebUI'yi başlatır, Open WebUI üzerinden oturum açar, `/api/models` denetimi yapar, ardından `/api/chat/completions` üzerinden gerçek bir proxy'lenmiş sohbet çalıştırır. Kullanılabilir bir canlı model anahtarı gerektirir (örneğin `~/.profile` içinde OpenAI), harici bir Open WebUI imajı çeker ve normal birim/e2e paketleri gibi CI-kararlı olması beklenmez.
- `pnpm test:docker:mcp-channels`: Tohumlanmış bir Gateway container'ı ve `openclaw mcp serve` başlatan ikinci bir istemci container'ı başlatır; ardından yönlendirilmiş konuşma keşfini, transkript okumalarını, ek üst verilerini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio köprüsü üzerinden Claude tarzı kanal + izin bildirimlerini doğrular. Claude bildirim doğrulaması ham stdio MCP karelerini doğrudan okur; böylece smoke testi köprünün gerçekten ne ürettiğini yansıtır.

## Yerel PR kapısı

Yerelde PR land/gate denetimleri için şunları çalıştırın:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` yüklü bir ana sistemde kararsız davranırsa, bunu bir regresyon olarak değerlendirmeden önce bir kez yeniden çalıştırın; ardından `pnpm test <path/to/test>` ile yalıtın. Bellek kısıtlı ana sistemler için şunları kullanın:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Model gecikme kıyası (yerel anahtarlar)

Betik: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Kullanım:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- İsteğe bağlı ortam değişkenleri: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Varsayılan istem: “Reply with a single word: ok. No punctuation or extra text.”

Son çalıştırma (2025-12-31, 20 çalıştırma):

- minimax medyan 1279ms (en düşük 1114, en yüksek 2431)
- opus medyan 2454ms (en düşük 1224, en yüksek 3170)

## CLI başlangıç kıyası

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
- `all`: her iki ön ayar

Çıktı, her komut için `sampleCount`, ortalama, p50, p95, min/max, exit-code/signal dağılımı ve maksimum RSS özetlerini içerir. İsteğe bağlı `--cpu-prof-dir` / `--heap-prof-dir`, her çalıştırma için V8 profilleri yazar; böylece zamanlama ve profil yakalama aynı harness'i kullanır.

Kaydedilmiş çıktı kuralları:

- `pnpm test:startup:bench:smoke`, hedefli smoke yapıtını `.artifacts/cli-startup-bench-smoke.json` konumuna yazar
- `pnpm test:startup:bench:save`, tam paket yapıtını `runs=5` ve `warmup=1` ile `.artifacts/cli-startup-bench-all.json` konumuna yazar
- `pnpm test:startup:bench:update`, depoya eklenmiş temel fixture'ı `runs=5` ve `warmup=1` ile `test/fixtures/cli-startup-bench.json` konumunda yeniler

Depoya eklenmiş fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` ile yenileyin
- Geçerli sonuçları fixture ile `pnpm test:startup:bench:check` kullanarak karşılaştırın

## Onboarding E2E (Docker)

Docker isteğe bağlıdır; buna yalnızca container içinde onboarding smoke testleri için ihtiyaç vardır.

Temiz bir Linux container'ında tam soğuk başlangıç akışı:

```bash
scripts/e2e/onboard-docker.sh
```

Bu betik, etkileşimli sihirbazı bir pseudo-tty üzerinden çalıştırır, yapılandırma/çalışma alanı/oturum dosyalarını doğrular, ardından Gateway'i başlatır ve `openclaw health` komutunu çalıştırır.

## QR içe aktarma smoke testi (Docker)

Bakımı yapılan QR çalışma zamanı yardımcısının desteklenen Docker Node çalışma zamanları altında yüklendiğinden emin olur (varsayılan Node 24, uyumlu Node 22):

```bash
pnpm test:docker:qr
```

## İlgili

- [Testing](/tr/help/testing)
- [Canlı testler](/tr/help/testing-live)
