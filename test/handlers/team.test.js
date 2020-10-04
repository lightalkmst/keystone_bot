const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const team = require ('../../src/handlers/team')

describe ('team', () => {
  beforeEach (reset_globals)

  it ('adds a player to your team')

  test_checks ({
    handler: team,
    functionality: 'add a player to your team',
    message: 'team',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      IN_PROGRESS_ERROR,
    ],
  })
})
