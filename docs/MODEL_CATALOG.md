# Maintaining the tutor model catalog

The course stays static on GitHub Pages. The browser reads `src/lib/ai/cloud/model-catalog.json`; it never calls a model-list API. Learner keys are used only for direct generation requests.

`Monthly tutor model catalog` runs at 09:17 UTC on the first day of each month, once the workflow is on the default branch. It can also be run manually with a dry-run option (the default).

The updater reads OpenAI's **featured text-model lineup** and Anthropic's **current Claude API model table**, directly from their official public Markdown documentation. This is a useful current selection, not an exhaustive list of every legacy, experimental, or account-specific model. The settings screen accepts an exact model ID for those cases.

```sh
npm run models:update
npm run test:catalog
```

The workflow needs no provider API keys and no third-party catalog. It opens or updates `codex/monthly-model-catalog`, preserves an existing maintenance branch, and proposes a pull request. It never auto-merges. Unchanged model data produces no timestamp-only commit. Unexpected source formats, empty/duplicate entries, large responses, and sharp list shrinkage fail without replacing the catalog.

Review IDs, additions/removals, and provider source links before merging. Public listing does not guarantee access for a particular account or successful tool use. The provider reports account or compatibility errors when a learner actually sends a question; the app never silently changes to another model.

GitHub Actions must be allowed to create pull requests in repository settings. The workflow requests contents and pull-requests write permissions only for this maintenance job. Pull requests made using `GITHUB_TOKEN` do not normally trigger another workflow automatically; the maintenance job runs its parser checks itself. Run the full CI workflow manually on the maintenance branch if a wider check is needed. The normal deployment checks still run after merge.
