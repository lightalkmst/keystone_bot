const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const register = require ('../../src/handlers/register')

describe ('register', () => {
  beforeEach (reset_globals)

  it ('adds you to the player registry', async () => {
    const req = basic_mock_request ('register')
    const m = await register (req)
    assert.deepEqual (players, [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }])
    assert (dirty)
  })

  test_checks ({
    handler: register,
    functionality: 'add you to the player registry',
    message: 'register',
    errors: [
      REGISTERED_ERROR,
    ],
  })
})
