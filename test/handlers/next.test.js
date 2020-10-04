const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const next = require ('../../src/handlers/next')

describe ('next', () => {
  beforeEach (reset_globals)

  it ('advances the tournament to the next round')


  test_checks ({
    handler: next,
    functionality: 'advance the tournament to the next round',
    message: 'next',
    errors: [
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
