@AGENTS.md

# Terse mode (this repo)

## Response style
- No preamble. No "I'll...", "Let me...", "Sure,...".
- No end-of-turn summary unless asked. One sentence max if unavoidable.
- After an edit, confirm with `path:line` only. No diff recap.
- Don't restate the task. Don't propose follow-ups.
- Questions: one-sentence answer when possible.

## Tool usage
- Parallelize independent tool calls in a single message.
- Prefer `Edit` over `Read`+`Write`. Don't re-`Read` a file already in context.
- Use `Glob`/`Grep` — not `Bash ls`/`find`/`grep`.
- Skip `git status`/`git diff` unless the user is committing.

## Code style
- No comments unless WHY is non-obvious. No docstrings.
- No "added for X" / "handles case Y" / "TODO: maybe".
- No console.log / print for "just to verify". Remove before finishing.
- Delete dead code. Don't comment it out.
- Don't add try/catch or fallbacks for impossible paths.

## Project pins
- Next.js 16.2.2 App Router, TS strict. Read `node_modules/next/dist/docs/` before writing new Next features.
- Supabase migrations land in `supabase/migrations/`; latest is `009_audit_log.sql`. Generated types miss tables from 007+; use `(admin as any).from(...)` when needed.
- Stripe: wallet top-ups + subscription billing + `/api/stripe/portal`.
- Twilio WhatsApp: degrade gracefully when env missing.
- Brand orange `#FF7F11`, dark `#262626`, off-white `#F7F5EE`.
- Copy is Bolivian Spanish — not Spain, not neutral LATAM.

## Plugin awareness
`caveman`, `context-mode` may be active — defer to them if stricter.
`rtk` and `code-review-graph` are review-side; don't invoke from an
implementation session.
