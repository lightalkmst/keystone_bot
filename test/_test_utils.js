require ('green_curry') (['globalize'])

require ('../src/init')

const util = require ('../src/util')

module.exports = {
  reset_globals: () => {
    players = []
    joined = []
    dropped = []
    round = 1
    in_progress = false
  },

  basic_mock_request: message => {
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
        user_id: 'test_id', // TODO
        id: 'test_id', // TODO
        player: {
          id: 'test_id',
          username: 'test_username',
          discriminator: 'test_discriminator',
          mmr: 1000,
          history: [],
        }, // TODO
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
  },
  // TODO: mock messaging functions
  // TODO: mock triggering message
  // TODO:
}
