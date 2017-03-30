# open-bot

An unoptionated bot driven by a configuration file in the repository.

* Operates on issue/PRs
* Triggered by webhook event or manual batch processing (CLI)
* Rules specify behavior
* Runs on AWS with serverless

## Configuration

* Add the bot's webhook to the webhooks in the repo/org configuration (content type json, events: `Issue comment`, `Issues`, `Pull request`, `Pull request review`, `Pull request review comment`, `Status`)
* Create a `open-bot.yaml` file in the repository root.
* Add the bot name to the yaml file (`bot` property)
* Add rules to the `rules` property (array) see [Rules](doc/rules.md)

## How does it work?

It checks all filters to get the lastest date where the filter matches. If not all filters match it stops here.

For each action it checks if and when the action was already applied. If yes it compares action date if lastest filter date and breaks if action was applied after filter match. Elsewise it runs the action.

This means: It makes sure that actions runs once **after** filters match. If filters match again, actions run again.

## Deploy your own bot

* Clone the repo
* Run `yarn`
* Run `node open-bot configurate` and answer questions
* Run `yarn run deploy-prod` to deploy the bot (takes a while)
  * Note you need to have AWS CLI tools installed and configurated
* Run `node open-bot` to gain access to the other tools, i. e. batch processing

## Contributing

### Add new `filters` or `actions`

* Add a file in the folder
* Edit the index.js file
* Test it locally with `node open-bot process some/repo#123 --settings open-bot.yaml --simulate`
* Send a PR

## License

MIT
