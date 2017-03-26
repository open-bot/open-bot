# Rules

A rule is a pair of `filters` and `actions`.

Example (complete configuration file):

``` yaml
bot: my-bot
rules:
- filters:
    commit: true
  actions:
    comment: Thanks for the commit.
```

This rule adds a comment to a pull request when anyone adds a commit to it.

## Filters

There are many filters available. If you miss one, send a PR.

### commit

Matches a commit in a PR.

``` yaml
commit: true
```

``` yaml
commit: ab?c # commit message
```

``` yaml
commit:
  matching: ab?c # commit message
  author: ab?c # author github login
  committer: ab?c # committer github login
```

### comment

``` yaml
comment: true
```

``` yaml
comment: ab?c # comment body
```

``` yaml
comment:
  matching: ab?c # comment body
  author: ab?c # comment author
```

### label

``` yaml
label: some-label # label name
```

``` yaml
label:
  - some-label # label name
  - some-other-label # label name
```

``` yaml
label:
  labels:
  - some-label # label name
  - some-other-label # label name
  labelRegExp: ab?c # label name regexp
```

### issue

``` yaml
issue: true
```

``` yaml
issue: ab?c # issue body
```

``` yaml
issue:
  matching: ab?c # issue body
  author: ab?c # issue author
```

### open

``` yaml
open: true # issue/PR is open
```

``` yaml
open: false # issue/PR is not open
```

### number_of_comments

``` yaml
number_of_comments: 3 # >= 3 comments in issue/PR
```

``` yaml
number_of_comments: # 3 - 6 comments in issue/PR
  minimum: 3
  maximum: 6
```

### review

``` yaml
review: true # there is a review in the PR
```

``` yaml
review: ab?c # there is a review with this body in the PR
```

``` yaml
review:
  matching: ab?c # review body
  state: ab?c # review state (APPROVED, CHANGES_REQUESTED, COMMENT)
  author: ab?c # author of review
  upToDate: true # review is on latest commit
```

### status

``` yaml
status: ab?c # PR status message
```

``` yaml
status: 
  matching: ab?c # PR status message
  state: ab?c # status state (success, failure, error, pending)
  context: ab?c # status context
```

### age

``` yaml
age: 4w # age of issue/PR (creation > 4 weeks)
```

``` yaml
age:
  minimum: 6h
  maximum: 4d # 6 hours - 4 days old
  minimumDate: 2016-01-01
  maximumDate: 2016-12-31 # created in 2016
```

### last_action_age

``` yaml
last_action_age: 4w # last user action in issue/PR
```

``` yaml
last_action_age:
  minimum: 10s
  maximum: 10m # 10 seconds - 10 minutes
  minimumDate: 2016-01-01
  maximumDate: 2016-12-31
```

### ensure

``` yaml
ensure:
  value: "{{comment.actor.login}}" # a value (see interpolation)
  matching: ab?c # matches this regexp
  equals: abc # is equal to
```

### any

``` yaml
any:
  comment: true
  age: 4w
```

Matches if any of the children match.

Here: Has a comment or is older than 4 weeks.

### not

``` yaml
not:
  comment: true
  age: 4w
```

Matches if children (all) don't match.

Here: Has no comment and is younger than 4 weeks.

### threshold

``` yaml
threshold:
  minimum: 2
  maximum: 3
  filters:
    comment_1: hello
    comment_2: hi
    comment_3: bye
    comment_4: bb
```

Matches if the number of matched children is between minimum and maximum.

Here: Has at least 2 of the comments "hello", "hi", "bye", "bb" but not all of them.

### in_order

``` yaml
in_order:
  commit: true
  review: true
```

Matches if the order of the matched children is correct.

Note: It doesn't look for any order pair. It matches the children on it's own and compares times after that.

Here: The latest review is after the latest commit.



## Actions

### close

``` yaml
close: true
```

Closes the issue/PR.

### reopen

``` yaml
reopen: true
```

Reopen the issue/PR.

### label

``` yaml
label: some-label # adds a label
```

``` yaml
label:
- some-label
- some-other-label
```

``` yaml
label:
 add:
  - some-label
  - some-other-label
 remove:
  - any-label
  - any-other-label
```

Adds and/or removes labels from issue/PR.

### comment

``` yaml
comment: Hello @{{issue.user.login}}!
```

``` yaml
comment:
  message: Hello @{{issue.user.login}}!
  identifier: comment-label
  readd: true
```

Adds a comment.

If `identifier` is provided is add or edits an comment with this identifier.

If `readd` is `true` it will move the comment to the bottom of the thread and sends notifications. It removes the old comment and adds a new one.

### status

``` yaml
status:
  description: "{{comment.body}}" # message
  target_url: "{{comment.html_url}}" # link
  context: status-label # the context of the PR status
  state: pending # one of success, failure, error, pending
```

Reports a pull request status.

## Interpolation

Handlebars.js is used to interpolate values.

### Context

`owner`: repo owner

`repo`: repo name

`item`: full issue name `open-bot/open-bot#1`

`botUsername`: the username of the bot

`data`: data provided by filters

`issue`: github api issue data

others: keys provided by the filters

Example:

``` yaml
- filters:
    comment_1: Hello
    comment_2: World
  actions:
    comment: |-
      Hello World provided by @{{comment_1.actor.login}} and @{{comment_2.actor.login}}.
```

Note: every filter/action key can be prefixed with `_(number)` to make them unique.

Note: you can add a `id` property to assign the value to some other name.

Note: See github api documentation for full object details.

### Helpers

`{{quote comment.body}}`: Wraps value in `>` to make it a markdown quote.

`{{stringify comment}}`: JSON.stringify the value.
