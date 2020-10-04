const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const teammates = require ('../../src/handlers/teammates')

describe ('teammates', () => {
  beforeEach (reset_globals)

  it ('posts a list of your teammates')

  test_checks ({
    handler: teammates,
    functionality: 'posts a list of your teammates',
    message: 'teammates',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
    ],
  })
})
