return

const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const template = require ('../../src/handlers/template')

describe ('template', () => {
  beforeEach (reset_globals)

  test_checks ({
    handler: template,
    functionality: '',
    message: 'template',
    errors: [
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
