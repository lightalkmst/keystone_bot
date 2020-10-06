const assert = require ('assert')

require ('green_curry') (['globalize'])

require ('../src/init')

const util = require ('../src/util')

// reset all global variables
const reset_globals = () => {
  players = []
  joined = []
  dropped = []
  round = 1
  in_progress = false
  dirty = false
  messages = {}
}

// create default
global.messages = {}
const basic_mock_request = message => {
  const split_message = S.split (' ') (message)
  const n = split_message [1] || ''
  const command = split_message [0]
  const mock_messages = k => ms => messages = {[k]: [... (messages[k] || []), ... ms]}
  const mock_message = k => m => mock_messages (k) ([m])
  const mock_check = F.ignore
  return {
    messaging: {
      send_message: mock_message ('message'),
      send_messages: mock_messages ('message'),
      send_direct_message: mock_message ('direct_message'),
      send_direct_messages: mock_messages ('direct_message'),
      send_admin_message: mock_message ('admin_message'),
      send_admin_messages: mock_messages ('admin_message'),
      send_dev_message: mock_message ('dev_message'),
      send_dev_messages: mock_messages ('dev_message'),
      send_user_message: mock_message ('user_message'),
      send_user_messages: mock_messages ('user_message'),
      send_main_message: mock_message ('main_message'),
      send_main_messages: mock_messages ('main_message'),
      send_log_message: mock_message ('log_message'),
      log_command: F.ignore,
      announce_pairings: F.ignore,
      print_scoreboard: F.ignore,
      cleanup: mock_message,
    },
    info: {
      message: {
        author: {
          username: 'test_username',
          discriminator: 'test_discriminator',
          id: 'test_id',
        },
      },
      is_admin: false,
      command,
      split_message,
      n,
      is_admin_command: false,
      user_id: 'test_id',
      id: 'test_id',
      player: {
        id: 'test_id',
        username: 'test_username',
        discriminator: 'test_discriminator',
        mmr: 1000,
        history: [],
      },
      player_entry: {

      }, // TODO
      captain: {

      }, // TODO
    },
    util: {
      ... util,
      user_string_by_id: F.id,
    },
    checks: {
      registered_check: mock_check,
      not_registered_check: mock_check,
      joined_check: mock_check,
      not_joined_check: mock_check,
      in_progress_check: mock_check,
      not_in_progress_check: mock_check,
      playing_check: mock_check,
      captain_check: mock_check,
    },
  }
}

const mock_player = i => ({
  discriminator: `test_discriminator${i}`,
  history: [],
  id: `test_id${i}`,
  mmr: 1000,
  username: `test_username${i}`,
})

const mock_joined = i => ({
  decks: [],
  id: `test_id${i}`,
  matchups: [],
  playing: true,
  points: 0,
  team: [],
})

const test_checks = ({
  handler,
  functionality,
  message,
  errors,
}) => {
  describe ('errors', () => {
    F.p (errors) (
      A.map (error =>
        F.match (error)
        .case (REGISTERED_ERROR) (() => ({
          error,
          check_text: 'you are already registered',
          check_name: 'not_registered_check',
        }))
        .case (NOT_REGISTERED_ERROR) (() => ({
          error,
          check_text: 'you are not registered',
          check_name: 'registered_check',
        }))
        .case (JOINED_ERROR) (() => ({
          error,
          check_text: 'you have already joined the tournament',
          check_name: 'not_joined_check',
        }))
        .case (NOT_JOINED_ERROR) (() => ({
          error,
          check_text: 'you have not joined the tournament',
          check_name: 'joined_check',
        }))
        .case (IN_PROGRESS_ERROR) (() => ({
          error,
          check_text: 'the tournament is already in progress',
          check_name: 'not_in_progress_check',
        }))
        .case (NOT_IN_PROGRESS_ERROR) (() => ({
          error,
          check_text: 'the tournament is not in progress',
          check_name: 'in_progress_check',
        }))
        .case (NOT_PLAYING_ERROR) (() => ({
          error,
          check_text: 'you are not currently playing a round',
          check_name: 'playing_check',
        }))
        .case (NOT_CAPTAIN_ERROR) (() => ({
          error,
          check_text: 'you are not the team captain',
          check_name: 'captain_check',
        }))
        .end ()
      )
      >> A.map (({
        error,
        check_text,
        check_name,
      }) =>
        it (`does not ${functionality} if ${check_text}`, async () => {
          const req = basic_mock_request (message)
          try {
            await handler ({
              ... req,
              checks: {
                ... req.checks,
                [check_name]: () => F.throw (error)
              },
            })
            assert.fail ()
          }
          catch (err) {
            assert.equal (err, error)
          }
        })
      )
    )
  })
}

module.exports = {
  reset_globals,
  basic_mock_request,
  mock_player,
  mock_joined,
  test_checks,
}
