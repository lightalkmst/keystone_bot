// !welcome to list the briefing
module.exports = async ({
  messaging: {
    send_main_messages,
  },
  info,
  util,
  checks: {
    not_in_progress_check,
  },
}) => {
  not_in_progress_check ()
  await send_main_messages ([
    `This is the automated tournament bot for CommuniTeam Esports`,
    `All players that want to participate should register with the bot using ${config.prefix}register`,
    `After registering, the bot will work in private messages`,
    `Players that want to join as a team captain for the next tournament should join with the bot using ${config.prefix}join`,
    `Players that want to join a team should have the team captain add them to the team with ${config.prefix}team`,
    `Once on a team, all commands should be issued only by the team captain`,
    `After all players have registered and joined, a tournament organizer starts the tournament with ${config.prefix}start`,
    `Use ${config.prefix}help to get a list of commands and their usages`,
  ])
}
