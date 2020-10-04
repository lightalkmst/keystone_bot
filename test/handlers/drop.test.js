const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const drop = require ('../../src/handlers/drop')

describe ('drop', () => {
  beforeEach (reset_globals)

  it ('drops you from the tournament')

  it ('drops you from the tournament if you are on a team')

  test_checks ({
    handler: drop,
    functionality: 'drop you from the tournament',
    message: 'drop',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      NOT_CAPTAIN_ERROR,
    ],
  })
})
