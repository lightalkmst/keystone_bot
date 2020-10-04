const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const help = require ('../../src/handlers/help')

describe ('help', () => {
  beforeEach (reset_globals)

  it ('does not fail', async () => {
    const req = basic_mock_request ('help')
    await help (req)
  })
})
