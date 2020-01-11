---

{{^hasErrors}}
Your code style completely follows the [style guide](https://github.com/danthareja/contribute-to-open-source/blob/master/CONTRIBUTING.md#style-guide). Nice job!
{{/hasErrors}}
{{#hasErrors}}
There are **{{data.errorCount}} style guide violations** in your contribution. I've marked them with inline comments for your convenience.

Please revisit your code and follow the [style guide best practices](https://github.com/danthareja/contribute-to-open-source/blob/master/CONTRIBUTING.md#style-guide).

_Hint: You might be able to fix some issues automatically by running `npm run lint -- --fix`_
{{/hasErrors}}
