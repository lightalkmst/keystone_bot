const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const mode = require ('../../src/handlers/mode')

describe ('mode', () => {
  beforeEach (reset_globals)

  it ('sets matchmaking mode to swiss')

  it ('sets matchmaking mode to double elimination')

  test_checks ({
    handler: mode,
    functionality: 'set matchmaking mode',
    message: 'mode swiss',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
