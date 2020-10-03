// !register to join the day's tournament
module.exports = async ({
  messaging: {
    send_direct_messages,
    log_command,
  },
  info: {
    id,
    message,
  },
  util,
  checks: {
    not_registered_check,
  },
}) => {
  not_registered_check ()
  players = [... players, {
    id,
    username: message.author.username,
    discriminator: message.author.discriminator,
    mmr: rules.starting_mmr,
    history: [],
  }]
  await send_direct_messages ([
    `Your account has been registered`,
    `Join the next tournament as a team captain by using ${config.prefix}join`,
    `Join a team by having the team captain add you by using ${config.prefix}team`,
    `Use ${config.prefix}help to get a list of commands and their usages`,
  ])
  await log_command ()
  dirty = true
}
