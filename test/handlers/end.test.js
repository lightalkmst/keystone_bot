const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const end = require ('../../src/handlers/end')

describe ('end', () => {
  beforeEach (reset_globals)

  it ('ends the tournament')

  it ('does not end the tournament if there are still games in progress')

  test_checks ({
    handler: end,
    functionality: 'end the tournament',
    message: 'end',
    errors: [
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
