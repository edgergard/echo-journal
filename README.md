# nextjs-pet-template

Стартовый шаблон Next.js для пет-проектов (учёба, портфолио, свои инструменты; без монетизации): код, тесты,
линт, форматирование, CI и конфигурация Claude Code. Мониторинга ошибок, продуктовой аналитики и health-эндпоинта
здесь нет — для монетизируемых приложений берите коммерческий шаблон
[template-nextjs-commercial](https://github.com/edgelordxd/template-nextjs-commercial) (Sentry, PostHog, `/api/health`).
Версии ниже сверены на момент создания шаблона (ноябрь 2026).

## Что внутри

### Стек

| Слой          | Что используется                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Фреймворк     | Next.js 16.4.6 (App Router, Turbopack по умолчанию для `dev` и `build`), React 19.3                 |
| Режимы Next   | Cache Components и Partial Prefetching включены в `next.config.ts` (так генерирует create-next-app) |
| Язык          | TypeScript 5.9: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`                          |
| Стили         | Tailwind CSS 4.3 через лоадер `@tailwindcss/turbopack` (PostCSS-конфига нет)                        |
| UI            | shadcn/ui 4.23: стиль `base-nova`, примитивы Base UI, иконки lucide; компонент `button`             |
| Валидация env | zod 4.6, без внешних env-библиотек (`src/env.ts`)                                                   |
| Тесты         | Vitest 5.1, Testing Library (react, dom, jest-dom), jsdom 29                                        |
| Качество кода | ESLint 9 (flat config, `eslint-config-next` + `eslint-config-prettier`), Prettier 3 + Tailwind      |
| Node.js       | 26 LTS (`.nvmrc`, `engines.node >= 22`), npm                                                        |

### Структура

```text
.claude/
  settings.json         плагины, разрешения и запреты для Claude Code
  skills/               собственные скиллы проекта (пока пусто)
.github/workflows/ci.yml
.vscode/extensions.json рекомендованные расширения: ESLint, Prettier, Tailwind
public/                 статика, отдаётся с корня сайта
src/
  app/                  layout, page, loading, error, global-error, not-found, globals.css
    readme/route.ts     отдаёт этот README как text/plain (ссылка с главной)
  components/
    ui/                 компоненты shadcn (button)
    copy-command.tsx    пример фичевого клиентского компонента
    copy-command.test.tsx
  hooks/                use-copy-to-clipboard.ts
  lib/                  utils.ts (cn), site-config.ts
  server/               server-only код (readme.ts, `import "server-only"`)
  env.ts                валидация переменных окружения
.env.example            список переменных, коммитится
AGENTS.md               блок инструкций, который поддерживает сам `next dev`
CLAUDE.md               правила проекта для Claude Code
.mcp.json               MCP-сервер Next.js (next-devtools-mcp)
```

Главная страница — минимальная заглушка: название проекта (из `NEXT_PUBLIC_APP_NAME`), команда `npm run check` с кнопкой копирования и ссылка на этот README (`/readme`). Маршрут `/readme` и ссылка на него работают только в `npm run dev` (в продакшене — 404), чтобы задеплоенный проект не публиковал внутренний README. Маршрут и `src/server/readme.ts` можно удалить, когда появится настоящий контент.

### Скрипты

| Команда                                   | Что делает                                                            |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                             | dev-сервер на http://localhost:3000                                   |
| `npm run build` / `npm run start`         | продакшен-сборка и её запуск                                          |
| `npm run lint` / `npm run lint:fix`       | ESLint (проверка / автоисправление)                                   |
| `npm run typecheck`                       | `next typegen && tsc --noEmit`                                        |
| `npm run test` / `npm run test:watch`     | Vitest один раз / в режиме наблюдения                                 |
| `npm run format` / `npm run format:check` | Prettier (записать / только проверить)                                |
| `npm run check`                           | lint → format:check → typecheck → test → build; гонять перед коммитом |

`typecheck` сначала запускает `next typegen`: глобальные типы `LayoutProps` / `PageProps` и `next-env.d.ts` генерируются Next.js и не хранятся в git. Без этого шага `tsc` в чистом клоне (и в CI) падает на `src/app/layout.tsx`.

### Переменные окружения

- Схемы лежат в `src/env.ts`: серверные переменные отдельно, клиентские (`NEXT_PUBLIC_*`) отдельно. Невалидное значение роняет `next build` с понятным сообщением (главная пререндерится и загружает `env`). Во время работы (`next dev`, `next start`) схема проверяется при первом выполнении кода, импортирующего `@/env`: ошибка превращается в ошибку запроса, сервер при этом не останавливается.
- Чтение серверной переменной из браузерного кода бросает ошибку, а не тихо возвращает `undefined`.
- Новая переменная: добавить в схему в `src/env.ts` (клиентскую — ещё и в `clientValues`), описать в `.env.example`, реальное значение положить в `.env.local`, в настройки проекта Vercel и в CI (`env:` джоба `check` в `.github/workflows/ci.yml`, секреты — через `${{ secrets.NAME }}`). Обязательная переменная без значения в CI уронит `npm run build`.
- В git попадает только `.env.example` (`.gitignore`: `.env*` и `!.env.example`).

### CI

`.github/workflows/ci.yml` запускается на push в `main` и `dev` и на pull request: `actions/checkout@v7` → `actions/setup-node@v7` (версия из `.nvmrc`, кеш npm) → `npm ci` → lint → format:check → typecheck → test → build.

### Тесты

Vitest + Testing Library, файлы `*.test.ts(x)` рядом с кодом. JSX в тестах компилирует встроенный трансформ Vite 8 (отдельный `@vitejs/plugin-react` не нужен). Пакет `server-only` в тестах подменён пустым модулем (`vitest.config.mts`), поэтому код из `src/server/` можно импортировать в тестах; функции с `"use cache"` / `cacheLife()` вне Next.js не работают — логику из них лучше выносить в обычные функции. Асинхронные Server Components Vitest не поддерживает — их агенты проверяют в браузере через Playwright CLI (`@playwright/test` уже в devDependencies, см. «Автоматизации»); для сквозных тестов можно добавить конфиг и тесты Playwright (`npm init playwright@latest`).

## Как создать новый проект из шаблона (PowerShell)

Проще всего — скиллом `/project-new <имя>` в Claude Code: для пет-проекта он создаёт приватный репозиторий из
этого шаблона (`edgelordxd/template-nextjs-pet`) на GitHub, переименовывает проект, проверяет `npm run check` и пушит `main`.
Ручной способ:

```powershell
# 1. Скопировать шаблон без мусора (robocopy: коды выхода 0–7 означают успех)
robocopy C:\Projects\_templates\nextjs-pet C:\Projects\my-app /E /XD node_modules .next .git .vercel coverage /XF .env .env.local settings.local.json *.tsbuildinfo next-env.d.ts /NFL /NDL /NJH /NP; if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" } else { $global:LASTEXITCODE = 0 }
Set-Location C:\Projects\my-app

# 2. Переименовать пакет
npm pkg set name=my-app
#    Отображаемое имя (<title>, заголовок главной) — NEXT_PUBLIC_APP_NAME:
#    вручную замените "nextjs-pet-template" на "my-app" в .env.example и в .default(...) в src/env.ts
#    (дефолт используется в CI и на Vercel, где переменная не задана)

# 3. Локальные переменные окружения
copy .env.example .env.local

# 4. Зависимости и полная проверка
npm install
npm run check

# 5. Git (CI запускается на push в main и dev и на pull request)
git init -b main
git add -A
git commit -m "chore: bootstrap from nextjs-pet-template"

# 6. (опционально) Привязать к проекту Vercel
npx vercel link
```

Минимум — Node.js 22 (`engines`); CI использует Node 26 LTS из `.nvmrc`, локально лучше ту же версию.

## Автоматизации

- **Рабочие копии агентов Paseo** (`paseo.json` → `scripts/worktree-setup.mjs`): при создании worktree копирует
  `.env.local` / `.env` из папки проекта, если они есть. Держите там только dev/sandbox-ключи.
- **Проверка в браузере для агентов**: `npx playwright cli open http://localhost:<port>`, затем `snapshot`,
  `click`, `screenshot` (скилл `.claude/skills/playwright-cli`; берёт установленный Chrome). В `npm run check`
  и CI не входит.
- **Хуки Claude Code** (`.claude/hooks/`, подключены в `.claude/settings.json`): после каждой правки файл
  форматируется Prettier; если сессия меняла `.ts/.tsx`, перед завершением ответа Claude прогоняет
  `npm run typecheck` и при ошибках получает их обратно (до двух раундов исправлений, дальше
  страхуют `npm run check` и CI).
- **CI** (`.github/workflows/ci.yml`): на push в `main`/`dev` и на каждый PR — lint, формат, типы,
  тесты, сборка.
- **Dependabot** (`.github/dependabot.yml`): раз в месяц один сгруппированный PR с minor/patch
  обновлениями npm и один — для GitHub Actions. Мажорные версии — вручную. В проектах `/product-build`
  в обе записи добавляется `target-branch: dev`; PR с исправлениями безопасности всё равно открываются в `main`.
- **Превью-деплой на Vercel** (настраивается один раз, без файлов в репо):
  1. vercel.com → Add New → Project → импортировать этот репозиторий (Vercel попросит доступ к
     GitHub-аккаунту владельца репо);
  2. в Settings → Environment Variables задать переменные из `.env.example` (для Preview и Production);
  3. дальше каждый PR получает комментарий со ссылкой на превью, а `main` — продакшен-деплой.

  Тариф Hobby бесплатный для некоммерческих проектов — пет-проектам его хватает.

## Claude Code

### Плагин vercel

- Глобально плагин `vercel` выключен; проект включает его в `.claude/settings.json` (`enabledPlugins`).
- Плагины приходят из аккаунта claude.ai: в Claude Desktop они подключаются как SDK-плагины с ID `<name>@inline`, при синхронизации в терминальный CLI — `<name>@synced`. Поэтому в `enabledPlugins` перечислены оба варианта.
- Плагин `vercel` сам регистрирует MCP-сервер Vercel, а Context7 приходит из коннектора claude.ai, поэтому в `.mcp.json` их нет.
- Выключить плагин только у себя — создать `.claude/settings.local.json` (уже в `.gitignore`; локальные настройки приоритетнее проектных):

```json
{
  "enabledPlugins": {
    "vercel@inline": false,
    "vercel@synced": false
  }
}
```

### Почему нет skillOverrides

Хотелось свернуть до одного имени (name-only) редко нужные скиллы плагина `vercel`: `eve`, `chat-sdk`, `microfrontends`, `vercel-sandbox`, `vercel-firewall`, `vercel-connect`, `next-forge`, `flags-sdk`, `marketplace`, `vercel-agent`, `build-agents`, `ai-gateway` — и оставить полными важные: `nextjs`, `next-cache-components`, `next-upgrade`, `shadcn`, `react-best-practices`, `turbopack`.

Но документация Claude Code прямо говорит: «Plugin skills are not affected by skillOverrides». `skillOverrides` работает только для обычных скиллов из `.claude/skills/`, поэтому в настройках его нет — это был бы no-op.

Обходной путь: выключить плагин в проекте и скопировать нужные скиллы в `.claude/skills/`. Тогда `skillOverrides` действует, но теряются хуки, MCP-сервер и обновления плагина — копии придётся поддерживать вручную.

### Разрешения

- `allow`: `npm run lint*`, `typecheck`, `test*`, `build`, `format*`, `check` — без запроса подтверждения. Плюс команды, которые нужны агентам `product-build` в worktree: `npm ci`, `git add/commit/fetch`, `git merge`/`rebase` с `dev`, обычный `git push` (без force), `gh pr create`. Правила продублированы для `Bash(...)` и `PowerShell(...)`: на Windows Claude Code запускает команды через инструмент PowerShell, а Bash-правила к нему не применяются.
- `deny`: `Read(./.env)`, `Read(./.env.*)` и последним `Read(!.env.example)`. Шаблон `.env.*` по синтаксису gitignore совпадает и с `.env.example`; `!`-правило, стоящее после него в том же списке того же файла, вырезает `.env.example` обратно (раздел «Special characters and `!` negation» в https://code.claude.com/docs/en/permissions). Read-запрет действует и на Edit/Write, и на распознаваемые файловые команды в shell (`cat`, `head`, …).

### MCP-сервер Next.js (`.mcp.json`)

`next-devtools-mcp` — официальный MCP-сервер Next.js, подключение описано в документации: https://nextjs.org/docs/app/guides/mcp. В `.mcp.json` ровно тот сниппет, который там приведён (`npx -y next-devtools-mcp@latest`).

- Начиная с Next.js 16 dev-сервер сам отдаёт MCP-эндпоинт `/_next/mcp`; `next-devtools-mcp` находит запущенный `npm run dev` и даёт агенту ошибки сборки и рантайма, логи, список маршрутов, метаданные страниц (инструменты `nextjs_index` / `nextjs_call`). Без запущенного dev-сервера работают только `nextjs_docs` и `browser_eval`.
- В интерактивной сессии Claude Code при первом запуске спросит, доверять ли серверу из `.mcp.json`; сбросить выбор: `claude mcp reset-project-choices`.
- Сервер собирает анонимную телеметрию; отключить: переменная окружения `NEXT_TELEMETRY_DISABLED=1`.

### Как проверить Claude-слой

Открыть Claude Code в папке проекта и выполнить:

- `/plugin` — `vercel` включён;
- `/skills` — видны скиллы `vercel:*`;
- `/context` — в разделе скиллов есть строки `vercel:`;
- `/mcp` — `next-devtools` подключён (после одобрения).

В терминальном CLI у владельца шаблона эти плагины сейчас не загружаются вообще, поэтому полная проверка — в Claude Desktop. В CLI можно подложить локальные копии плагинов:

```powershell
claude -p "/context" --plugin-dir "<путь к vercel>"
```
