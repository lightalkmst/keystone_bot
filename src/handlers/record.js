// !win/!loss/!draw to report the result
// TODO: parameterize and update
module.exports = async ({
  messaging,
  info,
  util,
  checks,
}) => {
  // records win result
  captain_check ()
  registered_check ()
  joined_check ()
  in_progress_check ()
  playing_check ()
  record_win (player)
  await send_messages ([
    `Your win has been recorded`,
    `Wait for the next round to begin`,
  ])
  await send_user_message (player.matchups [0].id, `Your opponent has recorded a loss for you`)
  await log_command ()
  dirty = true
}
// TODO: parameterize
