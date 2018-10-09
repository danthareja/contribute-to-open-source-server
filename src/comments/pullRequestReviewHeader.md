{{^hasErrors}}
I ran your code and everything looks great.

Thanks for your contribution @{{pull.user.login}}!
{{/hasErrors}}
{{#hasErrors}}
Great attempt @{{pull.user.login}}!

I ran your code and would like to request a few changes before merging your work. Please review my comments below and make the appropriate changes to your code.

After you update your code locally, follow the instructions to [save your changes locally](https://github.com/danthareja/contribute-to-open-source/blob/master/CONTRIBUTING.md#save-your-changes-locally) and [push your changes to your fork](https://github.com/danthareja/contribute-to-open-source/blob/master/CONTRIBUTING.md#send-your-changes-to-your-fork).

When you push your changes to your fork, I'll come back for another review.
{{/hasErrors}}
