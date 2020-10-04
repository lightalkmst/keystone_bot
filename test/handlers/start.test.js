const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const start = require ('../../src/handlers/start')

describe ('start', () => {
  beforeEach (reset_globals)

  it ('starts the tournament')

  it ('does not start the tournament if there are not enough players')

  test_checks ({
    handler: start,
    functionality: 'start the tournament',
    message: 'start',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
