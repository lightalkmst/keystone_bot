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
  switch (split_message [1]) {
    case 'swiss':
      matchmaker = swiss
      await send_message (`Matchmaking mode has been set to swiss cut`)
      break
    case 'double_elimination':
      matchmaker = double_elim
      await send_message (`Matchmaking mode has been set to double elimination`)
      break
  }
  dirty = true
}
