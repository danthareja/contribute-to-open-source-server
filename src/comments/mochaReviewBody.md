---

{{^hasAnyErrors}}
All the tests are passing. Nice job!
{{/hasAnyErrors}}
{{#hasRuntimeError}}
There was an error when running `npm test`. Please revisit your code and fix this error.

```
{{{runtimeError}}}
```

{{/hasRuntimeError}}
{{#hasTestErrors}}
{{#data.stats.pending}}
There are **{{data.stats.pending}} tests still pending**. In your test file, change `describe.skip` to `describe` and ensure they pass.
{{/data.stats.pending}}

{{#data.pending}}
⚠️ **{{{fullTitle}}}**
{{/data.pending}}

{{#data.stats.failures}}
There are **{{data.stats.failures}} tests failing**. Please revisit your code and make the failing tests pass.
{{/data.stats.failures}}

{{#data.failures}}
❌ **{{{fullTitle}}}**
{{#err.showDiff}}

```diff
-actual
+expected

-{{{err.actual}}}
+{{{err.expected}}}
```

{{/err.showDiff}}

```
{{{err.stack}}}
```

{{/data.failures}}
{{/hasTestErrors}}
