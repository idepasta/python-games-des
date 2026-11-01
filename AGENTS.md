<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep original lesson text and Python examples intact; customized examples are generated from the same settings used by each simulation, so optional functions stay synchronized.
- Keep optional-function definitions and pure game rules in a shared browser-safe module, with a lesson-scoped React provider holding settings and input values to avoid leaking choices between machines.
