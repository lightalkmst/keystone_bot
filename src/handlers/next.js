// !next starts the next round of the tournament
module.exports = async ({
  messaging: {
    send_messages,
    send_main_message,
    log_command,
    print_scoreboard,
    announce_pairings,
  },
  info: {
    is_admin_command,
  },
  util: {
    user_string,
    get_player_by_id,
    shuffle,
  },
  checks: {
    in_progress_check
  },
}) => {
  in_progress_check ()
  if (! is_admin_command) {
    await (`You are not a tournament organizer`)
    return
  }
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
  // begin matchmaking
  round++
  joined = matchmaker (shuffle (A.map (x => ({ ... x, playing: false })) (joined)))
  if (A.for_all (x => x.matchups [0].result === 'bye') (joined)) {
    await cleanup ()
    return
  }
  await print_scoreboard ()
  await send_main_message (`The next round of the tournament has begun`)
  // send direct message to each participant with their partner and respective decklists
  await announce_pairings ()
  await log_command ()
  dirty = true
}
