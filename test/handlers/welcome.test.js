const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const welcome = require ('../../src/handlers/welcome')

describe ('welcome', () => {
  beforeEach (reset_globals)

  it ('posts the welcome message', async () => {
    const req = basic_mock_request ('welcome')
    const m = await welcome (req)
    assert.deepEqual (messages.main_message,  [
      `This is the automated tournament bot for CommuniTeam Esports`,
      `All players that want to participate should register with the bot using ${config.prefix}register`,
      `After registering, the bot will work in private messages`,
      `Players that want to join as a team captain for the next tournament should join with the bot using ${config.prefix}join`,
      `Players that want to join a team should have the team captain add them to the team with ${config.prefix}team`,
      `Once on a team, all commands should be issued only by the team captain`,
      `After all players have registered and joined, a tournament organizer starts the tournament with ${config.prefix}start`,
      `Use ${config.prefix}help to get a list of commands and their usages`
    ])
    assert (! dirty)
  })

  test_checks ({
    handler: welcome,
    functionality: 'post the welcome message',
    message: 'welcome',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
