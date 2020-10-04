const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const play = require ('../../src/handlers/play')

describe ('play', () => {
  beforeEach (reset_globals)

  it ('checks you in as playing the current round')

  test_checks ({
    handler: play,
    functionality: 'check you in as playing the current round',
    message: 'play',
    errors: [
      NOT_CAPTAIN_ERROR,
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
