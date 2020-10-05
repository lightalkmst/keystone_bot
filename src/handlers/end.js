// !end to end the tournament
module.exports = async ({
  messaging: {
    send_messages,
    log_command,
  },
  info,
  util: {
    user_string,
    get_player_by_id,
    cleanup,
  },
  checks: {
    in_progress_check,
  },
}) => {
  in_progress_check ()
  if (A.exists (x => x.matchups [0].result === 'pending') (joined)) {
    const idle = A.filter (x => ! x.playing) (joined)
    const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (joined)
    const get_player_string = F.c () (D.get ('id') >> get_player_by_id >> user_string)
    await send_messages ([
      `The following players have not started their game:`,
      ... A.map (get_player_string) (idle),
      `The following players have not finished their game:`,
      ... A.map (get_player_string) (playing),
    ])
    return
  }
  await cleanup ()
  await log_command ()
  dirty = true
}
