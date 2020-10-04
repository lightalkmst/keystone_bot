const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const welcome = require ('../../src/handlers/welcome')

describe ('welcome', () => {
  beforeEach (reset_globals)

  it ('posts the welcome message')

  test_checks ({
    handler: welcome,
    functionality: 'post the welcome message',
    message: 'welcome',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
