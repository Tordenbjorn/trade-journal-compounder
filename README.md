# Trade journal compounder: hosted build kit (2026-10-10)

Live: https://trade-journal-compounder.vercel.app (Vercel project trade-journal-compounder, prj_1g1gDzBipdNKbIO8MyIkXH2nGnGs, Thor's hobby scope).
Data: Supabase project mxwgunhezmmqhbyfzlbr, table public.journal_kv (user_id, key, value), row-level security so each account sees only its own rows. Auth is email and password.

## What is in here
- src/tjc.jsx: the tool source as built (the Claude.ai artifact source plus four guards that switch the AI buttons off outside Claude.ai).
- src/entry-deploy.jsx: the hosted wrapper (sign in, create account, password reset, Supabase storage adapter that replaces window.storage).
- src/shims/: esbuild aliases that map react, react-dom/client, recharts and @supabase/supabase-js to the UMD globals loaded from unpkg in index.html.
- split.js and gen_index.js: cut the bundle into line-aligned chunks and write site/index.html with the SHA-256 integrity gate.
- site/: what is deployed. index.html plus chunks/c01.txt to c06.txt (the bundle, concatenated in order) and manifest.json (sizes and hashes).

## Rebuild
    npm install      # esbuild only
    npm run build    # bundles src/, cuts the chunks and writes site/ with fresh hashes

## Deploy
With the Vercel CLI: `vercel deploy site --prod` (framework none, no build step). Without it, the Vercel API path that was used on 2026-10-10: each chunk is inlined in its own preview deployment, then referenced by sha1 and size in the production deployment; Vercel refuses a reference whose sha it does not hold, which is the integrity check. One quirk of that path: a literal \uXXXX escape in the code is unescaped by the API tooling, so it has to be sent with the backslash itself escaped (\u005cuXXXX).

## Supabase pieces (already applied)
    create table public.journal_kv (user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, key text not null, value text not null, updated_at timestamptz not null default now(), primary key (user_id, key));
    alter table public.journal_kv enable row level security;
    -- select, insert, update, delete policies for authenticated users where (select auth.uid()) = user_id
    create index journal_kv_prefix_idx on public.journal_kv (user_id, key text_pattern_ops);
Still to set by hand in the Supabase dashboard (Authentication, URL configuration): Site URL and an allowed redirect URL of https://trade-journal-compounder.vercel.app, so confirmation and password-reset emails return to the app.
