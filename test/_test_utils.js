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
}

// create default
const basic_mock_request = message => {
  const split_message = S.split (' ') (message)
  const n = split_message [1] || ''
  const command = split_message [0]
  const mock_message = F.ignore
  const mock_check = F.ignore
  return {
    messaging: {
      send_message: mock_message,
      send_messages: mock_message,
      send_direct_message: mock_message,
      send_direct_messages: mock_message,
      send_admin_message: mock_message,
      send_admin_messages: mock_message,
      send_dev_message: mock_message,
      send_dev_messages: mock_message,
      send_user_message: mock_message,
      send_user_messages: mock_message,
      send_main_message: mock_message,
      send_main_messages: mock_message,
      send_log_message: mock_message,
      log_command: mock_message,
      announce_pairings: mock_message,
      print_scoreboard: mock_message,
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
    util,
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
          check_text: 'if you are already registered',
          check_name: 'not_registered_check',
        }))
        .case (NOT_REGISTERED_ERROR) (() => ({
          error,
          check_text: 'if you are not registered',
          check_name: 'registered_check',
        }))
        .case (JOINED_ERROR) (() => ({
          error,
          check_text: 'if you have already joined the tournament',
          check_name: 'not_joined_check',
        }))
        .case (NOT_JOINED_ERROR) (() => ({
          error,
          check_text: 'if you have not joined the tournament',
          check_name: 'joined_check',
        }))
        .case (IN_PROGRESS_ERROR) (() => ({
          error,
          check_text: 'if the tournament is already in progress',
          check_name: 'not_in_progress_check',
        }))
        .case (NOT_IN_PROGRESS_ERROR) (() => ({
          error,
          check_text: 'if the tournament is not in progress',
          check_name: 'in_progress_check',
        }))
        .case (NOT_PLAYING_ERROR) (() => ({
          error,
          check_text: 'if you are not currently playing a round',
          check_name: 'playing_check',
        }))
        .case (NOT_CAPTAIN_ERROR) (() => ({
          error,
          check_text: 'if you are not the team captain',
          check_name: 'captain_check',
        }))
        .end ()
      )
      >> A.map (({
        error,
        check_text,
        check_name,
      }) =>
        it (`does not ${functionality} ${check_name}`, async () => {
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
  test_checks,
}
