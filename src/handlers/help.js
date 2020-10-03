// !help list available commands
module.exports = async ({
  messaging: {
    send_message,
    send_messages,
  },
  info: {
    is_admin,
  },
  util,
  checks: {
    not_in_progress_check,
  },
}) => {
  if (is_admin) {
    await send_message (`Commands with an admin version can be used by using the ${config.admin_prefix} admin prefix and using the player's id as the first argument`)
  }
  // TODO: add new commands
  await F.p ([{
    check: false,
    command: `welcome`,
    effect: `print out the initial explanation of the bot`,
  }, {
    check: ! in_progress,
    command: `register`,
    effect: `sign up for the next tournament`,
  }, {
    check: ! in_progress,
    command: `team <@user>`,
    effect: `add another player to your team`,
  }, {
    check: ! in_progress,
    command: `deck <slot>`,
    effect: `submit a deck in the chosen slot from an image attachment`,
  }, {
    command: `decks`,
    effect: `review your submitted decks`,
  }, {
    command: `status`,
    effect: `print out the current status of each player in the tournament`,
  }, {
    check: in_progress,
    command: `scoreboard`,
    effect: `prints out the scores for the current tournament`,
  }, {
    check: in_progress,
    command: `leaderboard`,
    effect: `prints out a list of the top rated players`,
  }, {
    check: ! in_progress,
    command: `mode <swiss|double_elimination>`,
    effect: `sets the format for the next tournament`,
  }, {
    check: false,
    command: `start`,
    effect: `begin the tournament and designate the user of this command as the tournament organizer`,
  }, {
    check: false,
    command: `next`,
    effect: `begin the next round in the tournament unless there are players that are not ready`,
    has_admin_version: true,
  }, {
    check: in_progress,
    command: `play`,
    effect: `mark yourself as having begun your match against your opponent`,
  }, {
    check: in_progress,
    command: `win`,
    effect: `report that you won your match`,
    has_admin_version: true,
  }, {
    check: in_progress,
    command: `loss`,
    effect: `report that you lost your match`,
    has_admin_version: true,
  }, {
    check: in_progress,
    command: `draw`,
    effect: `report that you drew your match`,
    has_admin_version: true,
  }, {
    check: in_progress,
    command: `score`,
    effect: `shows your current score for the tournament`,
  }, {
    command: `drop [<@user>]`,
    effect: `withdraw the team or remove a teammate from the tournament`,
    has_admin_version: true,
  }, {
    check: false,
    command: `end`,
    effect: `end the tournament and print out the scoreboard`,
    has_admin_version: true,
  }, {
    command: `help`,
    effect: `Hint: you just used it`,
  }]) (
    A.filter (x => x.check || is_admin)
    >> A.map (({
      command,
      effect,
      has_admin_version = false,
    }) => [
      `Command: ${config.prefix}${command}`,
      `Effect: ${effect}`,
      ... (has_admin_version && is_admin ? [`This command has an admin version`] : [])
    ])
    >> A.fold (A.append) ([])
    >> send_messages
  )
}
