---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'OpenClaw sandboxing nasıl çalışır: modlar, kapsamlar, çalışma alanı erişimi ve görüntüler'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-14T02:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2573d0d7462f63a68eb1750e5432211522ff5b42989a17379d3e188468bbce52
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw, etki alanını azaltmak için **araçları sandbox arka uçları içinde** çalıştırabilir.
Bu **isteğe bağlıdır** ve yapılandırma tarafından kontrol edilir (`agents.defaults.sandbox` veya
`agents.list[].sandbox`). Sandboxing kapalıysa araçlar host üzerinde çalışır.
Gateway host üzerinde kalır; etkinleştirildiğinde araç yürütme yalıtılmış bir sandbox
içinde çalışır.

Bu kusursuz bir güvenlik sınırı değildir, ancak model aptalca bir şey yaptığında
dosya sistemi ve süreç erişimini anlamlı ölçüde sınırlar.

## Neler sandbox içine alınır

- Araç yürütme (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` vb.).
- İsteğe bağlı sandbox tarayıcısı (`agents.defaults.sandbox.browser`).
  - Varsayılan olarak sandbox tarayıcısı, tarayıcı aracı ona ihtiyaç duyduğunda otomatik başlar (CDP'nin erişilebilir olmasını sağlar).
    `agents.defaults.sandbox.browser.autoStart` ve `agents.defaults.sandbox.browser.autoStartTimeoutMs` ile yapılandırın.
  - Varsayılan olarak sandbox tarayıcı container'ları, genel `bridge` ağı yerine özel bir Docker ağı (`openclaw-sandbox-browser`) kullanır.
    `agents.defaults.sandbox.browser.network` ile yapılandırın.
  - İsteğe bağlı `agents.defaults.sandbox.browser.cdpSourceRange`, container kenarındaki CDP girişini bir CIDR izin listesiyle sınırlar (örneğin `172.21.0.1/32`).
  - noVNC gözlemci erişimi varsayılan olarak parola ile korunur; OpenClaw yerel bir bootstrap sayfası sunan ve noVNC'yi URL fragment içinde parola ile açan kısa ömürlü bir token URL'si üretir (sorgu/header log'larında değil).
  - `agents.defaults.sandbox.browser.allowHostControl`, sandbox içindeki oturumların host tarayıcıyı açıkça hedeflemesine izin verir.
  - İsteğe bağlı izin listeleri `target: "custom"` için geçit görevi görür: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Sandbox içine alınmayanlar:

- Gateway sürecinin kendisi.
- Açıkça sandbox dışında çalışmasına izin verilen herhangi bir araç (ör. `tools.elevated`).
  - **Elevated exec, sandboxing'i atlar ve yapılandırılmış kaçış yolunu kullanır (`gateway` varsayılan, veya exec hedefi `node` ise `node`).**
  - Sandboxing kapalıysa `tools.elevated` yürütmeyi değiştirmez (zaten host üzerindedir). Bkz. [Elevated Mode](/tr/tools/elevated).

## Modlar

`agents.defaults.sandbox.mode`, sandboxing'in **ne zaman** kullanılacağını kontrol eder:

- `"off"`: sandboxing yok.
- `"non-main"`: yalnızca **main olmayan** oturumları sandbox içine alır (normal sohbetleri host üzerinde istiyorsanız varsayılan).
- `"all"`: her oturum bir sandbox içinde çalışır.
  Not: `"non-main"`, agent id'sine değil `session.mainKey` değerine (varsayılan `"main"`) dayanır.
  Grup/kanal oturumları kendi anahtarlarını kullanır, bu yüzden main olmayan sayılırlar ve sandbox içine alınırlar.

## Kapsam

`agents.defaults.sandbox.scope`, **kaç container** oluşturulacağını kontrol eder:

- `"agent"` (varsayılan): agent başına bir container.
- `"session"`: oturum başına bir container.
- `"shared"`: tüm sandbox içindeki oturumlar tarafından paylaşılan tek bir container.

## Arka uç

`agents.defaults.sandbox.backend`, sandbox'ı hangi çalışma zamanının sağlayacağını kontrol eder:

- `"docker"` (varsayılan): yerel Docker destekli sandbox çalışma zamanı.
- `"ssh"`: genel SSH destekli uzak sandbox çalışma zamanı.
- `"openshell"`: OpenShell destekli sandbox çalışma zamanı.

SSH'ye özgü yapılandırma `agents.defaults.sandbox.ssh` altında bulunur.
OpenShell'e özgü yapılandırma `plugins.entries.openshell.config` altında bulunur.

### Bir arka uç seçme

|                     | Docker                           | SSH                            | OpenShell                                                     |
| ------------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| **Çalıştığı yer**   | Yerel container                  | SSH ile erişilebilen herhangi bir host | OpenShell tarafından yönetilen sandbox                        |
| **Kurulum**         | `scripts/sandbox-setup.sh`       | SSH anahtarı + hedef host      | OpenShell Plugin etkin                                         |
| **Çalışma alanı modeli** | Bind mount veya kopyalama    | Uzak-kanonik (bir kez tohumlama) | `mirror` veya `remote`                                        |
| **Ağ kontrolü**     | `docker.network` (varsayılan: none) | Uzak hosta bağlı             | OpenShell'e bağlı                                             |
| **Tarayıcı sandbox'ı** | Desteklenir                  | Desteklenmez                   | Henüz desteklenmiyor                                          |
| **Bind mount'lar**  | `docker.binds`                   | Yok                            | Yok                                                           |
| **En uygun kullanım** | Yerel geliştirme, tam yalıtım  | Yükü uzak bir makineye aktarma | İsteğe bağlı çift yönlü senkronizasyonlu yönetilen uzak sandbox'lar |

### Docker arka ucu

Docker arka ucu varsayılan çalışma zamanıdır; araçları ve sandbox tarayıcılarını Docker daemon soketi (`/var/run/docker.sock`) üzerinden yerel olarak çalıştırır. Sandbox container yalıtımı Docker namespace'leri tarafından belirlenir.

**Docker-out-of-Docker (DooD) Kısıtlamaları**:
OpenClaw Gateway'in kendisini bir Docker container'ı olarak dağıtırsanız, host'un Docker soketini kullanarak kardeş sandbox container'larını orkestre eder (DooD). Bu, belirli bir yol eşleme kısıtlaması getirir:

- **Yapılandırma Host Yolları Gerektirir**: `openclaw.json` içindeki `workspace` yapılandırması, dahili Gateway container yolu yerine **Host'un mutlak yolunu** içermelidir (ör. `/home/user/.openclaw/workspaces`). OpenClaw, Docker daemon'undan bir sandbox başlatmasını istediğinde daemon yolları Gateway namespace'ine göre değil, Host OS namespace'ine göre değerlendirir.
- **FS Bridge Eşliği (Aynı Volume Haritası)**: OpenClaw Gateway yerel süreci de `workspace` dizinine heartbeat ve bridge dosyaları yazar. Gateway, aynı string'i (host yolu) kendi container ortamı içinden değerlendirdiği için Gateway dağıtımı, host namespace'ini yerel olarak bağlayan aynı volume haritasını da içermelidir (`-v /home/user/.openclaw:/home/user/.openclaw`).

Yolları içeride mutlak host eşliği olmadan eşlerseniz, OpenClaw container ortamı içinde heartbeat yazmaya çalışırken yerel olarak `EACCES` izin hatası verir çünkü tam nitelikli yol string'i yerel olarak mevcut değildir.

### SSH arka ucu

OpenClaw'ın `exec`, dosya araçlarını ve medya okumalarını
herhangi bir SSH ile erişilebilen makinede sandbox içine almasını istiyorsanız `backend: "ssh"` kullanın.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Veya yerel dosyalar yerine SecretRefs / satır içi içerik kullanın:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Nasıl çalışır:

- OpenClaw, `sandbox.ssh.workspaceRoot` altında kapsam başına bir uzak kök oluşturur.
- Oluşturma veya yeniden oluşturma sonrasındaki ilk kullanımda OpenClaw, bu uzak çalışma alanını yerel çalışma alanından bir kez tohumlar.
- Sonrasında `exec`, `read`, `write`, `edit`, `apply_patch`, prompt medya okumaları ve gelen medya hazırlama işlemleri doğrudan uzak çalışma alanına karşı SSH üzerinden çalışır.
- OpenClaw, uzaktaki değişiklikleri otomatik olarak yerel çalışma alanına geri senkronize etmez.

Kimlik doğrulama materyali:

- `identityFile`, `certificateFile`, `knownHostsFile`: mevcut yerel dosyaları kullanır ve bunları OpenSSH yapılandırması üzerinden geçirir.
- `identityData`, `certificateData`, `knownHostsData`: satır içi string'ler veya SecretRef'ler kullanır. OpenClaw bunları normal secret çalışma zamanı snapshot'ı üzerinden çözer, `0600` izinleriyle geçici dosyalara yazar ve SSH oturumu sona erdiğinde siler.
- Aynı öğe için hem `*File` hem `*Data` ayarlanmışsa, o SSH oturumu için `*Data` kazanır.

Bu bir **uzak-kanonik** modeldir. İlk tohumlamadan sonra gerçek sandbox durumu uzak SSH çalışma alanı olur.

Önemli sonuçlar:

- Tohumlama adımından sonra OpenClaw dışında host üzerinde yapılan yerel düzenlemeler, sandbox yeniden oluşturulana kadar uzakta görünmez.
- `openclaw sandbox recreate`, kapsam başına uzak kökü siler ve bir sonraki kullanımda tekrar yerelden tohumlar.
- Tarayıcı sandboxing, SSH arka ucunda desteklenmez.
- `sandbox.docker.*` ayarları SSH arka ucuna uygulanmaz.

### OpenShell arka ucu

OpenClaw'ın araçları OpenShell tarafından yönetilen uzak bir ortamda
sandbox içine almasını istiyorsanız `backend: "openshell"` kullanın. Tam kurulum kılavuzu, yapılandırma
referansı ve çalışma alanı modu karşılaştırması için özel
[OpenShell sayfasına](/tr/gateway/openshell) bakın.

OpenShell, genel SSH arka ucuyla aynı temel SSH taşımasını ve uzak dosya sistemi köprüsünü yeniden kullanır
ve buna OpenShell'e özgü yaşam döngüsü
(`sandbox create/get/delete`, `sandbox ssh-config`) ile isteğe bağlı `mirror`
çalışma alanı modunu ekler.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell modları:

- `mirror` (varsayılan): yerel çalışma alanı kanonik kalır. OpenClaw, exec öncesinde yerel dosyaları OpenShell'e senkronize eder ve exec sonrasında uzak çalışma alanını geri senkronize eder.
- `remote`: sandbox oluşturulduktan sonra OpenShell çalışma alanı kanonik olur. OpenClaw uzak çalışma alanını bir kez yerel çalışma alanından tohumlar, ardından dosya araçları ve exec, değişiklikleri geri senkronize etmeden doğrudan uzak sandbox üzerinde çalışır.

Uzak taşıma ayrıntıları:

- OpenClaw, OpenShell'den `openshell sandbox ssh-config <name>` aracılığıyla sandbox'a özgü SSH yapılandırması ister.
- Çekirdek bu SSH yapılandırmasını geçici bir dosyaya yazar, SSH oturumunu açar ve `backend: "ssh"` tarafından kullanılan aynı uzak dosya sistemi köprüsünü yeniden kullanır.
- Yalnızca `mirror` modunda yaşam döngüsü farklıdır: exec öncesinde yerelden uzağa senkronize eder, ardından geri senkronize eder.

Geçerli OpenShell sınırlamaları:

- sandbox tarayıcısı henüz desteklenmiyor
- `sandbox.docker.binds`, OpenShell arka ucunda desteklenmez
- `sandbox.docker.*` altındaki Docker'a özgü çalışma zamanı ayarları hâlâ yalnızca Docker arka ucuna uygulanır

#### Çalışma alanı modları

OpenShell'in iki çalışma alanı modeli vardır. Pratikte en çok önem taşıyan kısım budur.

##### `mirror`

**Yerel çalışma alanının kanonik kalmasını** istiyorsanız `plugins.entries.openshell.config.mode: "mirror"` kullanın.

Davranış:

- `exec` öncesinde OpenClaw, yerel çalışma alanını OpenShell sandbox'ına senkronize eder.
- `exec` sonrasında OpenClaw, uzak çalışma alanını tekrar yerel çalışma alanına senkronize eder.
- Dosya araçları yine sandbox köprüsü üzerinden çalışır, ancak turlar arasında yerel çalışma alanı doğruluk kaynağı olarak kalır.

Bunu şu durumlarda kullanın:

- OpenClaw dışında dosyaları yerel olarak düzenliyorsanız ve bu değişikliklerin sandbox'ta otomatik görünmesini istiyorsanız
- OpenShell sandbox'ının mümkün olduğunca Docker arka ucuna benzemesini istiyorsanız
- Her exec turundan sonra host çalışma alanının sandbox yazımlarını yansıtmasını istiyorsanız

Takas:

- exec öncesi ve sonrası ek senkronizasyon maliyeti

##### `remote`

**OpenShell çalışma alanının kanonik hale gelmesini** istiyorsanız `plugins.entries.openshell.config.mode: "remote"` kullanın.

Davranış:

- Sandbox ilk oluşturulduğunda OpenClaw, uzak çalışma alanını bir kez yerel çalışma alanından tohumlar.
- Sonrasında `exec`, `read`, `write`, `edit` ve `apply_patch` doğrudan uzak OpenShell çalışma alanına karşı çalışır.
- OpenClaw, uzaktaki değişiklikleri `exec` sonrasında yerel çalışma alanına **geri senkronize etmez**.
- Prompt zamanındaki medya okumaları yine çalışır çünkü dosya ve medya araçları yerel bir host yolunu varsaymak yerine sandbox köprüsü üzerinden okur.
- Taşıma, `openshell sandbox ssh-config` tarafından döndürülen OpenShell sandbox'ına SSH ile yapılır.

Önemli sonuçlar:

- Tohumlama adımından sonra host üzerinde OpenClaw dışında dosyaları düzenlerseniz, uzak sandbox bu değişiklikleri otomatik olarak **görmez**.
- Sandbox yeniden oluşturulursa, uzak çalışma alanı tekrar yerel çalışma alanından tohumlanır.
- `scope: "agent"` veya `scope: "shared"` ile bu uzak çalışma alanı aynı kapsamda paylaşılır.

Bunu şu durumlarda kullanın:

- sandbox'ın öncelikli olarak uzak OpenShell tarafında yaşamasını istiyorsanız
- tur başına daha düşük senkronizasyon yükü istiyorsanız
- host üzerindeki yerel düzenlemelerin uzaktaki sandbox durumunun üzerine sessizce yazmasını istemiyorsanız

Sandbox'ı geçici bir yürütme ortamı olarak düşünüyorsanız `mirror` seçin.
Sandbox'ı gerçek çalışma alanı olarak düşünüyorsanız `remote` seçin.

#### OpenShell yaşam döngüsü

OpenShell sandbox'ları hâlâ normal sandbox yaşam döngüsü üzerinden yönetilir:

- `openclaw sandbox list`, Docker çalışma zamanlarının yanı sıra OpenShell çalışma zamanlarını da gösterir
- `openclaw sandbox recreate`, mevcut çalışma zamanını siler ve OpenClaw'ın bir sonraki kullanımda onu yeniden oluşturmasına izin verir
- temizleme mantığı da arka uç farkındalıklıdır

`remote` modu için recreate özellikle önemlidir:

- recreate, o kapsam için kanonik uzak çalışma alanını siler
- sonraki kullanım, yerel çalışma alanından yeni bir uzak çalışma alanı tohumlar

`mirror` modunda recreate esas olarak uzak yürütme ortamını sıfırlar
çünkü yerel çalışma alanı zaten kanonik kalır.

## Çalışma alanı erişimi

`agents.defaults.sandbox.workspaceAccess`, sandbox'ın **neyi görebileceğini** kontrol eder:

- `"none"` (varsayılan): araçlar `~/.openclaw/sandboxes` altında bir sandbox çalışma alanı görür.
- `"ro"`: agent çalışma alanını `/agent` konumuna salt okunur olarak mount eder (`write`/`edit`/`apply_patch` devre dışı kalır).
- `"rw"`: agent çalışma alanını `/workspace` konumuna okuma/yazma olarak mount eder.

OpenShell arka ucunda:

- `mirror` modu, `exec` turları arasında yerel çalışma alanını yine kanonik kaynak olarak kullanır
- `remote` modu, ilk tohumlamadan sonra uzak OpenShell çalışma alanını kanonik kaynak olarak kullanır
- `workspaceAccess: "ro"` ve `"none"` yine yazma davranışını aynı şekilde sınırlar

Gelen medya etkin sandbox çalışma alanına kopyalanır (`media/inbound/*`).
Skills notu: `read` aracı sandbox köküne bağlıdır. `workspaceAccess: "none"` ile
OpenClaw, okunabilmeleri için uygun Skills öğelerini sandbox çalışma alanına (`.../skills`) yansıtır.
`"rw"` ile çalışma alanı Skills öğeleri
`/workspace/skills` altından okunabilir.

## Özel bind mount'lar

`agents.defaults.sandbox.docker.binds`, ek host dizinlerini container içine mount eder.
Biçim: `host:container:mode` (ör. `"/home/user/source:/source:rw"`).

Genel ve agent başına bind'ler **birleştirilir** (değiştirilmez). `scope: "shared"` altında agent başına bind'ler yok sayılır.

`agents.defaults.sandbox.browser.binds`, ek host dizinlerini yalnızca **sandbox tarayıcı** container'ına mount eder.

- Ayarlandığında (`[]` dahil), tarayıcı container'ı için `agents.defaults.sandbox.docker.binds` değerini değiştirir.
- Atlanırsa, tarayıcı container'ı geriye dönük uyumluluk için `agents.defaults.sandbox.docker.binds` değerine geri döner.

Örnek (salt okunur kaynak + ek bir veri dizini):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Güvenlik notları:

- Bind'ler sandbox dosya sistemini baypas eder: ayarladığınız kipte (`:ro` veya `:rw`) host yollarını açığa çıkarırlar.
- OpenClaw tehlikeli bind kaynaklarını engeller (örneğin: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` ve bunları açığa çıkaracak üst mount'lar).
- OpenClaw ayrıca `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` ve `~/.ssh` gibi yaygın home dizini kimlik bilgisi köklerini de engeller.
- Bind doğrulaması yalnızca string eşleştirmesi değildir. OpenClaw kaynak yolu normalize eder, ardından engellenen yolları ve izin verilen kökleri yeniden kontrol etmeden önce onu mevcut en derin üst öğe üzerinden tekrar çözer.
- Bu, son yaprak henüz mevcut olmasa bile symlink üst öğe kaçışlarının yine de güvenli biçimde başarısız olacağı anlamına gelir. Örnek: `/workspace/run-link/new-file`, `run-link` oraya işaret ediyorsa yine `/var/run/...` olarak çözülür.
- İzin verilen kaynak kökleri de aynı şekilde kanonikleştirilir; dolayısıyla symlink çözümlemesinden önce yalnızca izin listesi içinde gibi görünen bir yol bile `outside allowed roots` olarak reddedilir.
- Hassas mount'lar (secret'lar, SSH anahtarları, servis kimlik bilgileri), kesinlikle gerekmedikçe `:ro` olmalıdır.
- Çalışma alanına yalnızca okuma erişimi gerekiyorsa `workspaceAccess: "ro"` ile birlikte kullanın; bind kipleri bağımsız kalır.
- Bind'lerin araç ilkesi ve elevated exec ile nasıl etkileştiği için bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).

## Görüntüler + kurulum

Varsayılan Docker image'ı: `openclaw-sandbox:bookworm-slim`

Bunu bir kez oluşturun:

```bash
scripts/sandbox-setup.sh
```

Not: varsayılan image, Node içermez. Bir Skill Node'a (veya
başka çalışma zamanlarına) ihtiyaç duyuyorsa ya özel bir image oluşturun ya da
`sandbox.docker.setupCommand` üzerinden kurun (ağ çıkışı + yazılabilir root +
root kullanıcı gerektirir).

`curl`, `jq`, `nodejs`, `python3`, `git` gibi yaygın araçlara sahip
daha işlevsel bir sandbox image'ı istiyorsanız, şunu oluşturun:

```bash
scripts/sandbox-common-setup.sh
```

Ardından `agents.defaults.sandbox.docker.image` değerini
`openclaw-sandbox-common:bookworm-slim` olarak ayarlayın.

Sandbox tarayıcı image'ı:

```bash
scripts/sandbox-browser-setup.sh
```

Varsayılan olarak Docker sandbox container'ları **ağ olmadan** çalışır.
`agents.defaults.sandbox.docker.network` ile geçersiz kılın.

Paketlenmiş sandbox tarayıcı image'ı ayrıca
container tabanlı iş yükleri için temkinli Chromium başlangıç varsayılanları uygular. Mevcut container varsayılanları şunlardır:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox` etkin olduğunda `--no-sandbox` ve `--disable-setuid-sandbox`.
- Üç grafik sertleştirme bayrağı (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) isteğe bağlıdır ve
  container'larda GPU desteği olmadığında kullanışlıdır. İş yükünüz WebGL veya diğer 3D/tarayıcı özelliklerini gerektiriyorsa
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  ayarlayın.
- `--disable-extensions` varsayılan olarak etkindir ve
  eklentiye bağımlı akışlar için `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ile devre dışı bırakılabilir.
- `--renderer-process-limit=2`,
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` tarafından kontrol edilir; burada `0`, Chromium'un varsayılanını korur.

Farklı bir çalışma zamanı profiline ihtiyacınız varsa özel bir tarayıcı image'ı kullanın ve
kendi entrypoint'inizi sağlayın. Yerel (container olmayan) Chromium profilleri için,
ek başlangıç bayrakları eklemek üzere `browser.extraArgs` kullanın.

Güvenlik varsayılanları:

- `network: "host"` engellenir.
- `network: "container:<id>"` varsayılan olarak engellenir (namespace join baypas riski).
- Cam kırma geçersiz kılma: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker kurulumları ve container içindeki gateway burada bulunur:
[Docker](/tr/install/docker)

Docker gateway dağıtımları için `scripts/docker/setup.sh`, sandbox yapılandırmasını önyükleyebilir.
Bu yolu etkinleştirmek için `OPENCLAW_SANDBOX=1` (veya `true`/`yes`/`on`) ayarlayın.
Soket konumunu `OPENCLAW_DOCKER_SOCKET` ile geçersiz kılabilirsiniz. Tam kurulum ve ortam
referansı: [Docker](/tr/install/docker#agent-sandbox).

## setupCommand (tek seferlik container kurulumu)

`setupCommand`, sandbox container oluşturulduktan sonra **bir kez** çalışır (her çalıştırmada değil).
Container içinde `sh -lc` aracılığıyla yürütülür.

Yollar:

- Genel: `agents.defaults.sandbox.docker.setupCommand`
- Agent başına: `agents.list[].sandbox.docker.setupCommand`

Yaygın tuzaklar:

- Varsayılan `docker.network` `"none"` değerindedir (çıkış yok), dolayısıyla paket kurulumları başarısız olur.
- `docker.network: "container:<id>"`, `dangerouslyAllowContainerNamespaceJoin: true` gerektirir ve yalnızca acil durum içindir.
- `readOnlyRoot: true` yazmayı engeller; `readOnlyRoot: false` ayarlayın veya özel bir image oluşturun.
- Paket kurulumları için `user` root olmalıdır (`user` değerini atlayın veya `user: "0:0"` ayarlayın).
- Sandbox exec host `process.env` değerini miras almaz. Skill API anahtarları için
  `agents.defaults.sandbox.docker.env` (veya özel bir image) kullanın.

## Araç ilkesi + kaçış kapıları

Sandbox kurallarından önce araç izin/verme engelleme ilkeleri yine uygulanır. Bir araç
genel olarak veya agent başına engellenmişse, sandboxing onu geri getirmez.

`tools.elevated`, `exec` işlemini sandbox dışında çalıştıran açık bir kaçış kapısıdır (`gateway` varsayılan, veya exec hedefi `node` ise `node`).
`/exec` direktifleri yalnızca yetkili göndericiler için geçerlidir ve oturum başına kalıcıdır; `exec` işlevini kalıcı olarak devre dışı bırakmak için
araç ilkesinde deny kullanın (bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)).

Hata ayıklama:

- Etkili sandbox modunu, araç ilkesini ve düzeltme yapılandırma anahtarlarını incelemek için `openclaw sandbox explain` kullanın.
- “Bu neden engelleniyor?” zihinsel modeli için bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated).
  Sıkı tutun.

## Çok agent'lı geçersiz kılmalar

Her agent sandbox + araçları geçersiz kılabilir:
`agents.list[].sandbox` ve `agents.list[].tools` (ayrıca sandbox araç ilkesi için `agents.list[].tools.sandbox.tools`).
Öncelik için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

## En küçük etkinleştirme örneği

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## İlgili dokümanlar

- [OpenShell](/tr/gateway/openshell) -- yönetilen sandbox arka ucu kurulumu, çalışma alanı modları ve yapılandırma referansı
- [Sandbox Configuration](/tr/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- “bu neden engellendi?” hata ayıklaması
- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar ve öncelik
- [Security](/tr/gateway/security)
