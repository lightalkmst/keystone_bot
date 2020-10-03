const double_elim = require ('../matchmakers/double_elimination')
const swiss = require ('../matchmakers/swiss')

// !mode picks the tournament mode
module.exports = async ({
  messaging: {
    send_message,
  },
  info: {
    split_message,
  },
  util,
  checks: {
    not_in_progress_check,
  },
}) => {
  not_in_progress_check ()
  await F.match (split_message [1])
  .case ('swiss') (async () => {
    matchmaker = swiss
    await send_message (`Matchmaking mode has been set to swiss cut`)
  })
  .case ('double_elimination') (async () => {
    matchmaker = double_elim
    await send_message (`Matchmaking mode has been set to double elimination`)
  })
  .default (async () => `"${split_message [1]}" is not a valid mode\nValid modes are "swiss" and "double_elimination"`)
  dirty = true
}
