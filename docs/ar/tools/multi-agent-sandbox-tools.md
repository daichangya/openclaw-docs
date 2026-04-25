---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: '"قيود sandbox والأدوات لكل agent، والأولوية، والأمثلة"'
title: sandbox والأدوات متعددة الـ agent
x-i18n:
    generated_at: "2026-04-25T14:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# تهيئة sandbox والأدوات متعددة الـ agent

يمكن لكل agent في إعداد متعدد الـ agent تجاوز سياسة sandbox والأدوات
العالمية. تغطي هذه الصفحة التهيئة لكل agent، وقواعد الأولوية، و
الأمثلة.

- **واجهات sandbox وأوضاعها**: راجع [Sandboxing](/ar/gateway/sandboxing).
- **تصحيح الأدوات المحظورة**: راجع [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) و`openclaw sandbox explain`.
- **Exec المرفوع**: راجع [Elevated Mode](/ar/tools/elevated).

تكون المصادقة لكل agent: يقرأ كل agent من مخزن المصادقة الخاص به في `agentDir` على
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
ولا تتم **مشاركة** بيانات الاعتماد بين الـ agents. لا تعِد استخدام `agentDir` بين agents.
إذا أردت مشاركة بيانات الاعتماد، فانسخ `auth-profiles.json` إلى `agentDir` الخاص بالـ agent الآخر.

---

## أمثلة التهيئة

### المثال 1: agent شخصي + agent عائلي مقيّد

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**النتيجة:**

- agent ‏`main`: يعمل على المضيف، مع وصول كامل إلى الأدوات
- agent ‏`family`: يعمل داخل Docker (حاوية واحدة لكل agent)، مع أداة `read` فقط

---

### المثال 2: agent للعمل مع sandbox مشترك

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### المثال 2ب: ملف تعريف coding عام + agent للمراسلة فقط

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**النتيجة:**

- تحصل الـ agents الافتراضية على أدوات coding
- agent ‏`support` مخصص للمراسلة فقط (+ أداة Slack)

---

### المثال 3: أوضاع sandbox مختلفة لكل agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## أولوية التهيئة

عندما توجد إعدادات عامة (`agents.defaults.*`) وإعدادات خاصة بالـ agent (`agents.list[].*`) معًا:

### تهيئة sandbox

تتجاوز الإعدادات الخاصة بالـ agent الإعدادات العامة:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**ملاحظات:**

- يتجاوز `agents.list[].sandbox.{docker,browser,prune}.*` القيمة `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الـ agent (ويُتجاهل عندما يُحل نطاق sandbox إلى `"shared"`).

### قيود الأدوات

ترتيب التصفية هو:

1. **ملف تعريف الأداة** (`tools.profile` أو `agents.list[].tools.profile`)
2. **ملف تعريف أدوات الموفّر** (`tools.byProvider[provider].profile` أو `agents.list[].tools.byProvider[provider].profile`)
3. **سياسة الأدوات العامة** (`tools.allow` / `tools.deny`)
4. **سياسة أدوات الموفّر** (`tools.byProvider[provider].allow/deny`)
5. **سياسة الأدوات الخاصة بالـ agent** (`agents.list[].tools.allow/deny`)
6. **سياسة موفّر agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **سياسة أدوات sandbox** (`tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`)
8. **سياسة أدوات subagent** (`tools.subagents.tools`، إن انطبق)

يمكن لكل مستوى تقييد الأدوات أكثر، لكنه لا يستطيع إعادة منح الأدوات الممنوعة من مستويات سابقة.
إذا كان `agents.list[].tools.sandbox.tools` مضبوطًا، فإنه يستبدل `tools.sandbox.tools` لذلك الـ agent.
إذا كان `agents.list[].tools.profile` مضبوطًا، فإنه يتجاوز `tools.profile` لذلك الـ agent.
تقبل مفاتيح أدوات الموفّر إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

إذا أدت أي قائمة سماح صريحة في هذه السلسلة إلى عدم بقاء أدوات قابلة للاستدعاء في التشغيل،
فإن OpenClaw يتوقف قبل إرسال الموجّه إلى النموذج. وهذا مقصود:
إذ يجب أن يفشل agent مهيأ بأداة مفقودة مثل
`agents.list[].tools.allow: ["query_db"]` بشكل واضح حتى يتم تمكين Plugin
الذي يسجل `query_db`، لا أن يستمر كـ agent نصي فقط.

تدعم سياسات الأدوات اختصارات `group:*` التي تتوسع إلى عدة أدوات. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للاطلاع على القائمة الكاملة.

يمكن لتجاوزات elevated الخاصة بكل agent (`agents.list[].tools.elevated`) تقييد exec المرفوع أكثر لوكلاء محددين. راجع [Elevated Mode](/ar/tools/elevated) للتفاصيل.

---

## الترحيل من agent واحد

**قبل (agent واحد):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**بعد (متعدد الـ agent مع ملفات تعريف مختلفة):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

يتم ترحيل إعدادات `agent.*` القديمة بواسطة `openclaw doctor`؛ ويفضل استخدام `agents.defaults` + `agents.list` مستقبلًا.

---

## أمثلة على قيود الأدوات

### agent للقراءة فقط

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### agent لتنفيذ آمن (من دون تعديلات على الملفات)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### agent للتواصل فقط

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

تعيد `sessions_history` في ملف التعريف هذا عرض استدعاء مقيدًا ومنقّى
بدلًا من تفريغ نص خام. إذ يزيل استدعاء المساعد وسوم التفكير،
وبنية `<relevant-memories>`،
وحمولات XML النصية العادية لاستدعاءات الأدوات
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
وبنية استدعاءات الأدوات المخفّضة، ورموز التحكم الخاصة بالنموذج المسرّبة
بصيغة ASCII/العرض الكامل، وXML استدعاءات أدوات MiniMax المشوّه
قبل الإخفاء/الاقتطاع.

---

## خطأ شائع: `"non-main"`

يعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)،
وليس على معرّف agent. تحصل جلسات المجموعات/القنوات دائمًا على مفاتيحها الخاصة، لذا
تُعامل على أنها غير رئيسية وستُوضع داخل sandbox. إذا كنت تريد Agent لا يستخدم
sandbox أبدًا، فاضبط `agents.list[].sandbox.mode: "off"`.

---

## الاختبار

بعد تهيئة sandbox والأدوات متعددة الـ agent:

1. **تحقق من تحليل agent:**

   ```exec
   openclaw agents list --bindings
   ```

2. **تحقق من حاويات sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **اختبر قيود الأدوات:**
   - أرسل رسالة تتطلب أدوات مقيّدة
   - تحقّق من أن agent لا يمكنه استخدام الأدوات الممنوعة

4. **راقب السجلات:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## استكشاف الأخطاء وإصلاحها

### agent غير موضوع داخل sandbox رغم `mode: "all"`

- تحقّق مما إذا كانت هناك قيمة عامة `agents.defaults.sandbox.mode` تتجاوزها
- تأخذ التهيئة الخاصة بالـ agent الأولوية، لذا اضبط `agents.list[].sandbox.mode: "all"`

### الأدوات ما زالت متاحة رغم قائمة المنع

- تحقّق من ترتيب تصفية الأدوات: عام → agent → sandbox → subagent
- يمكن لكل مستوى فقط زيادة التقييد، لا إعادة المنح
- تحقّق عبر السجلات: `[tools] filtering tools for agent:${agentId}`

### الحاوية غير معزولة لكل agent

- اضبط `scope: "agent"` في تهيئة sandbox الخاصة بالـ agent
- القيمة الافتراضية هي `"session"`، ما ينشئ حاوية واحدة لكل جلسة

---

## ذو صلة

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل لـ sandbox (الأوضاع، والنطاقات، والواجهات، والصور)
- [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- تصحيح "لماذا هذا محظور؟"
- [Elevated Mode](/ar/tools/elevated)
- [التوجيه متعدد الـ agent](/ar/concepts/multi-agent)
- [تهيئة sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [إدارة الجلسات](/ar/concepts/session)
