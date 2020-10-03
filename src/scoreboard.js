// !scoreboard to print out the current scores
module.exports = async ({
  messaging: {
    log_command,
  },
  info,
  util: {
    print_scoreboard,
  },
  checks: {
    in_progress_check,
  },
}) => {
  in_progress_check ()
  await print_scoreboard ()
  await log_command ()
}
