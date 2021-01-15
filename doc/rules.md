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

Matches a commit in a PR.

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

Matches a comment in a issue/PR.

Makes the comment info accessible via data.

If `matching` is a regular expression, it also makes the match accessible via data with `_match` prefix.

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

Matches a label in a issue/PR.

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
  title: ab?c # issue title
  author: ab?c # issue author
  locked: true # issue is locked or not
```

Matches an issue.

Note: Doesn't match pull request.

### pull_request

``` yaml
pull_request: true
```

``` yaml
pull_request: ab?c # pull request body
```

``` yaml
pull_request:
  matching: ab?c # pull request body
  title: ab?c # pull request title
  author: ab?c # pull request author
  locked: true # pull request is locked or not
  merged: true # pull request is merged or not
  mergeable: true # pull request is mergeable or not
  merged_by: ab?c # login of person who merged the PR
  head_ref: ab?c # branchname of PR source
  base_ref: ab?c # branchname of PR target
  mergeable_state: ab?c # state of the PR
    # one of: clean, dirty, blocked, stable, unstable, unknown
```

Matches a pull request.

Note: Doesn't match issue.

### open

``` yaml
open: true # issue/PR is open
```

``` yaml
open: false # issue/PR is not open
```

Matches if the state of the issue is open/closed.

### number_of_comments

``` yaml
number_of_comments: 3 # >= 3 comments in issue/PR
```

``` yaml
number_of_comments: # 3 - 6 comments in issue/PR
  minimum: 3
  maximum: 6
```

Matches the number of comments in a issue/PR.

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

Matches a pull request review.

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

### check

``` yaml
check: ab?c # PR check message
```

``` yaml
check:
  matching: ab?c # PR check message
  conclusion: ab?c # check conclusion (success, failure)
  name: ab?c # check context
```

Matches pull request check.

### permission

``` yaml
permission: true # issue creator has write or admin permission
```

``` yaml
permission: ab?c # issue creator permission level (admin, write, read, none)
```

``` yaml
permission:
  user: "{{comment.actor.login}}" # user to review permission for
  matching: ab?c # permission level (admin, write, read, none)
```

Matches if the permission level of the user matches the regular expression.

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

Matches if the issue/PR age is in the range.


``` yaml
age:
  value: "{{comment.created_at}}"
  minimum: 6h
  maximum: 4d # 6 hours - 4 days old
  minimumDate: 2016-01-01
  maximumDate: 2016-12-31 # created in 2016
```

Matches if the provided date value is in the range.

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
  includeBotActions: true
```

Matches if the last action age is in the range.

`includeBotActions` defaults to false, which excludes actions from the bot itself (only user actions).

### ensure

``` yaml
ensure:
  value: "{{comment.actor.login}}" # a value (see interpolation)
  matching: ab?c # matches this regexp
  notMatching: ab?c # doesn't match this regexp
  equals: abc # is equal to (interpolation possible)
  notEquals: abc # is not equal to (interpolation possible)
  range: "< 10, 15 - 20" # is in this range (see range)
```

Matches if the condition is true.

### any

``` yaml
any:
  comment: true
  age: 4w
```

Matches if any of the children match.

Here: Has a comment or is older than 4 weeks.

### all

``` yaml
all:
  comment: true
  age: 4w
```

Matches if all of the children match.

Here: Has a comment and is older than 4 weeks.

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
  invasive: true
  edit: true
```

Adds a comment.

If `identifier` is provided it removes an old comment with the same identifier.

If `invasive` is set it resent the comment even if the body is equal.

`invasive` defaults to `false` if `identifier` is set and to `true` otherwise.

If `edit` is `true` it will edit the old comment instead will the new message.

If `message` is empty or undefined it will not add a new comment. It may remove an old comment if `identifer` is set.

### status

``` yaml
status:
  description: "{{comment.body}}" # message
  target_url: "{{comment.html_url}}" # link
  context: status-label # the context of the PR status
  state: pending # one of success, failure, error, pending
```

Reports a pull request status.

### merge

``` yaml
merge:
  commit_title: "Merge pull request #{{pull_request.number}}"
  commit_message: "{{pull_request.title}}"
  merge_method: merge # one of merge, squash, rebase
```

Merges a PR. Like pressing the merge button.

### set

``` yaml
set:
  id: SOME_VARIABLE_NAME
  value: "{{comment.body}}"
```

Sets a variable name to some value. This variable is also available in rules followed by this rule. Best read this variable with the `ensure` filter.

### schedule

``` yaml
schedule: 2d # 2 days
```

Schedule another rules check in the specified timespan. The lowest schedule wins and overwrite any longer schedule.

## Range

Some expressions accept ranges. Example:

``` text
< 10 > 5, 15-20
```

Means: (smaller than 10 and bigger than 5) or between 15 and 20 (inclusive)

``` js
// in javascript
(x < 10 && x > 5) || (x >= 5 && x <= 20)
```

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

## Examples

``` yaml
- filters: # Look for a comment
    comment: Hello
  actions: # Post a new comment
    comment: Hello @{{comment.actor.login}}.
```

Respond to any comment containing "Hello" with a comment "Hello @user.".

``` yaml
- filters:
    open: true
    status: # Look for the latest travis results
      context: "continuous-integration/travis-ci/pr"
    ensure: # Check travis state
      value: "{{status.state}}"
      equals: "success"
  actions:
    label: # relabel
      add: "ci-ok"
      remove: "ci-not-ok"
    comment: # post comment
      identifier: "ci-result"
      edit: true
      message: |-
        Success! :smile:
- filters:
    open: true
    status:
      context: "continuous-integration/travis-ci/pr"
    ensure:
      value: "{{status.state}}"
      equals: "failure"
  actions:
    label:
      add: "ci-not-ok"
      remove: "ci-ok"
    comment:
      identifier: "ci-result"
      edit: true
      message: |-
        Failed. @{{issue.user.login}} Check [CI results]({{status.target_url}})!
```

Label pull request with `ci-ok` or `ci-not-ok` depending on the CI result. Also comment on the pull request to trigger the user.

``` yaml
- filters:
    open: true
    threshold:
      maximum: 1
      filters:
        issue_1: Type
        issue_2: Expected
        issue_3: Current
  actions:
    label: missing-information
    close: true
    comment: Closed because information is missing. Edit the issue!
- filters:
    open: false
    label: missing-information
    threshold:
      minimum: 2
      filters:
        issue_1: Type
        issue_2: Expected
        issue_3: Current
  actions:
    label:
      remove: missing-information
    reopen: true
    comment: Thanks!
```

Require at least two of `Type` `Expected` and `Current` in the issue. Elsewise close the issue and comment. Reopens when information is added later.
