const buildDebug = require("debug");
const path = require("path");
const fs = require("fs");

const debug = buildDebug("files:configuration");

const CONFIG_JS_FILENAME = "vve-i18n-cli.config.js";

function findConfigUpwards() {
  let dirname = rootDir;
  while (true) {
    if (fs.existsSync(path.join(dirname, CONFIG_JS_FILENAME))) {
      return dirname;
    }
    const nextDir = path.dirname(dirname);
    if (dirname === nextDir) break;
    dirname = nextDir;
  }
  return null;
}

function findConfig (dirname) {
  const filepath = path.resolve(dirname, CONFIG_JS_FILENAME);
  const conf = readConfig(filepath);
  if (conf) {
    debug("Found root config %o in %o.", CONFIG_JS_FILENAME, dirname);
  }
  return conf;
}

function loadConfig (filepath) {
  try {
    const conf = readConfig(filepath)
    return conf
  } catch (e) {
    debug('error', e)
    return null
  }
}

function readConfig(filepath) {
  let options;
  try {
    const configModule = require(filepath);
    options = configModule && configModule.__esModule
        ? configModule.default || undefined
        : configModule;
  } catch (err) {
    throw err;
  } finally {
  }
  return {
    filepath,
    dirname: path.dirname(filepath),
    options,
  }
}

module.exports = {
  findConfigUpwards,
  loadConfig,
  readConfig,
}