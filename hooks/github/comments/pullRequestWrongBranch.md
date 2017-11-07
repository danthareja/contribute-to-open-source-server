@{{pull.user.login}}, I have to close this pull request :sob:

As mentioned in the [contributing guidelines](https://github.com/danthareja/contribute-to-open-source/blob/master/CONTRIBUTING.md#submit-a-pull-request), I can only accept a pull request made to *your* base branch. This important step allows multiple people to contribute code to the repo.

Please open another pull request with the following values:

* **base fork:** `{{{pull.base.repo.full_name}}}`
* **base:** `{{pull.head.user.login}}`
* **head fork:** `{{{pull.head.repo.full_name}}}`
* **compare:** `{{pull.head.ref}}`

I'll be happy to review that one :smile_cat: