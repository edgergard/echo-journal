---
project: echo-journal
track: web
status: preparing
launched: ""
url: ""
date: "2026-11-23"
---

# Echo Journal — запуск

## Готовность (Readiness)

- main = dev, CI на main зелёный: да — 20b888c (PR #8), `npm run check` на main: 184 теста, exit 0.
- Пробелы приёмки, перенесённые в запуск:
  - Must #1 — проверить вход по email/GitHub и демо-аккаунт на реальном Supabase (никогда не запускался).
  - Must #4 — проверить реальную память: эмбеддинги OpenRouter + pgvector `match_entries` на preview.
  - Must #7 — деплой на Vercel, ссылка в README, замер Lighthouse (GIF — по желанию).

## Инвентарь данных (Data)

| Данные | Куда уходят (сервис) | Зачем | Хранение |
| --- | --- | --- | --- |
| Email; при входе через GitHub — имя и аватар профиля | Supabase Auth | вход | до удаления аккаунта |
| Текст записей, настроение, даты | Supabase Postgres | сам дневник | до удаления записи или аккаунта |
| Ответы Echo и ссылки «Recalled» (цитаты до 140 символов из прошлых записей) | Supabase Postgres | ответы | до удаления записи или аккаунта; цитата удалённой записи остаётся в ответах к более поздним записям |
| Эмбеддинги записей (векторы) | Supabase pgvector, считаются через OpenRouter | память (поиск похожих записей) | до удаления записи или аккаунта |
| Текст записи (до 2000 символов) и цитаты прошлых записей; записи недели (до 600 символов каждая) | OpenRouter → провайдер модели, только провайдеры без сбора данных (`data_collection: "deny"`) | ответ Echo и недельная сводка | провайдеры, которые обучаются на данных, исключены; OpenRouter по своей политике не обучает модели на запросах |
| Полный текст записи (до 5000 символов) для эмбеддинга | OpenRouter embeddings (тот же запрет) | память | как выше |
| Счётчик AI-запросов за день | Supabase Postgres | дневной лимит | по дням |
| Cookie сессии (Supabase, демо) | браузер | оставаться в системе | на время сессии |
| IP, логи запросов | Vercel (хостинг) | работа сайта | по политике Vercel |

Аналитики, рекламы и трекинговых cookie нет — нужны только строго необходимые cookie, баннер согласия не требуется.

## Юридические страницы (Legal)

- `/privacy` — черновик по инвентарю выше; оператор: Oleksandr Bryksin (частное лицо, Украина), контакт — issues в github.com/edgergard/echo-journal. Помечен «Draft — not legal advice». Нужна твоя вычитка перед публикацией.
- `/terms` — черновик: некоммерческий портфолио-проект, «не терапия и не медицинская помощь», без гарантий, демо-данные сбрасываются.

## Preflight (Preflight)

- [x] Секреты не читаются в клиентском коде — pass.
- [x] Страница 404 (`src/app/not-found.tsx`) — pass.
- [x] Демо-вход без регистрации — pass (в реальном режиме нужен демо-пользователь в Supabase, шаг 5).
- [x] Защита расходов: модель через `OPENROUTER_CHAT_MODEL`, лимит 10 в день, ответ ≤ 250 токенов, 429 без списания — pass; лимит трат на ключе (you), шаг 5.
- [x] `robots` (закрыты `/journal`, `/week`, `/settings`, `/api`, `/auth`) и `sitemap` — PR #9.
- [x] Open Graph и `metadataBase` — PR #9.
- [x] Ссылки на `/privacy` и `/terms`: футер лендинга, страница входа, «About Echo» в настройках — PR #9.
- [x] OpenRouter `data_collection: "deny"` для чата и эмбеддингов — PR #9 (решение 2026-11-23).
- [x] Вход только GitHub + демо: email-форма за флагом `AUTH_EMAIL_ENABLED` (по умолчанию выключен) — PR #10 (решение 2026-11-23).

## Сервисы и ключи (Services)

Supabase — отдельный аккаунт для пет-проектов (лимит бесплатных проектов считается на пользователя).

- [x] Пет-аккаунт Supabase и проект `echo-journal`, ref `nsucnzbzpdgjybixzifb` (you)
- [x] MCP `supabase-pet` для этой папки: только этот проект, группы database/debugging/development/docs (you — вход; agent — настройка)
- [ ] Миграция `supabase/migrations/0001_init.sql` через `supabase-pet` + проверка RLS и advisors (agent, по твоему «да»)
- [ ] Auth → Providers: Email выключить; GitHub включить — OAuth App на GitHub с callback `https://nsucnzbzpdgjybixzifb.supabase.co/auth/v1/callback`, Client ID и Secret в Supabase (you)
- [ ] Демо-пользователь: Auth → Users → Add user (email + пароль, подтверждён) (you); демо-записи — «Reset demo data» в настройках после первого входа
- [ ] OpenRouter: ключ, лимит трат $1–2, минимальное пополнение для эмбеддингов (you); модель чата выберем на preview
- [ ] Vercel (Hobby): импорт `edgergard/echo-journal`, production-ветка `main`; env **до первого деплоя** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, `OPENROUTER_API_KEY`, `OPENROUTER_CHAT_MODEL` — для Production и Preview (you)
- [ ] Supabase → Auth → URL Configuration: Site URL = адрес продакшна; Redirect URLs = продакшн `/auth/callback` + шаблон preview (`https://*-<scope>.vercel.app/**`) (you, после создания проекта в Vercel)

## Деплой (Deploy)

_Шаг 6._

## Календарь ручных шагов (Calendar)

| Когда | Что | Кто |
| ----- | --- | --- |
| раз в неделю без активности | бесплатный проект Supabase засыпает — зайти в демо или нажать Restore в панели | you |

## Известные пробелы (Gaps)

- Реальные Supabase и OpenRouter ещё не запускались.

## Дальше (Next)

После запуска `/product` покажет дни с даты `launched`; исправления — через `/ship-pr`.
