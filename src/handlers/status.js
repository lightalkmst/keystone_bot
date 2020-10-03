// !status lists out any players that aren't ready and what they are missing
module.exports = async ({
  messaging: {
    send_messages,
  },
  info,
  util: {
    user_string,
    get_player_by_id,
  },
  checks,
}) => {
  if (! in_progress) {
    await send_messages ([
      `There are ${joined.length} players registered for the next tournament`,
      `The expected seeding for current players is:`,
      ... A.map (x => x || '(bye)') (seed (joined)),
    ])
    return
  }
  const idle = A.filter (x => ! x.playing) (joined)
  const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (joined)
  const won = A.filter (x => x.matchups [0].result === 'win') (joined)
  const lost = A.filter (x => x.matchups [0].result === 'loss') (joined)
  const drew = A.filter (x => x.matchups [0].result === 'draw') (joined)
  const bye = A.filter (x => x.matchups [0].result === 'bye') (joined)
  const get_player_string = F.c () (D.get ('id') >> get_player_by_id >> user_string)
  await send_messages ([
    `The following players are idle:`,
    ... A.map (get_player_string) (idle),
    `The following players are playing:`,
    ... A.map (get_player_string) (playing),
    `The following players have won their game:`,
    ... A.map (get_player_string) (won),
    `The following players have lost their game:`,
    ... A.map (get_player_string) (lost),
    `The following players have drawn their game:`,
    ... A.map (get_player_string) (drew),
    `The following players received a bye:`,
    ... A.map (get_player_string) (bye),
  ])
}
