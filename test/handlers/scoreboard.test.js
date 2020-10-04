const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const scoreboard = require ('../../src/handlers/scoreboard')

describe ('scoreboard', () => {
  beforeEach (reset_globals)

  it ('posts the scoreboard for the current tournament')

  test_checks ({
    handler: scoreboard,
    functionality: 'posts the scoreboard for the current tournament',
    message: 'scoreboard',
    errors: [
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
