// !win/!loss/!draw to report the result
module.exports = ([
  p_result,
  o_result,
]) => async ({
  messaging: {
    send_messages,
    send_user_message,
    log_command,
  },
  info,
  util: {
    record_match,
  },
  checks: {
    captain_check,
    registered_check,
    joined_check,
    in_progress_check,
    playing_check,
  },
}) => {
  captain_check ()
  registered_check ()
  joined_check ()
  in_progress_check ()
  playing_check ()
  record_match (p_result) (player)
  await send_messages ([
    `Your ${p_result} has been recorded`,
    `Wait for the next round to begin`,
  ])
  await send_user_message (player.matchups [0].id, `Your opponent has recorded a ${o_result} for you`)
  await log_command ()
  dirty = true
}
