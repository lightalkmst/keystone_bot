const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const help = require ('../../src/handlers/help')

describe ('help', () => {
  beforeEach (reset_globals)

  it ('posts out of tournament help', async () => {
    const req = basic_mock_request ('help')
    await help (req)
    assert.deepEqual (messages.message, [
      'Command: !register',
      'Effect: sign up for the next tournament',
      'Command: !team <@user>',
      'Effect: add another player to your team',
      'Command: !deck <slot>',
      'Effect: submit a deck in the chosen slot from an image attachment',
      'Command: !mode <swiss|double_elimination>',
      'Effect: sets the format for the next tournament',
    ])
    assert (! dirty)
  })
})
