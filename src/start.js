// !start closes registration and starts the tournament
module.exports = async ({
  messaging: {
    send_message,
    send_main_message,
    log_command,
  },
  info,
  util: {
    announce_pairings,
  },
  checks: {
    not_in_progress_check,
  },
}) => {
  if (A.length (joined) <= 1) {
    not_in_progress_check ()
    await send_message (`Not enough players to start a tournament`)
    return
  }
  not_in_progress_check ()
  in_progress = true
  await send_main_message (`The tournament has begun`)
  // begin matchmaking
  round++
  joined = matchmaker (shuffle (joined))
  // send direct message to each participant with their partner and respective decklists
  await announce_pairings ()
  await log_command ()
  dirty = true
}
