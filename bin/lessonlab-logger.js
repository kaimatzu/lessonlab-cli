const chalk = require("chalk");

function ll_info(string) {
  console.info(chalk.green(string));
}

function ll_warn(string) {
  console.warn(chalk.yellow.bold(string));
}

function ll_error(string) {
  console.error(chalk.red.bold(string));
}

function ll_trace(string) {
  console.info(chalk.white(string));
}

module.exports = {
  ll_info,
  ll_warn,
  ll_error,
  ll_trace,
};
