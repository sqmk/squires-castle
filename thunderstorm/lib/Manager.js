'use strict';

let huejay = require('huejay');
let Afplay = require('afplay');
let chalk  = require('chalk');
let fs     = require('fs');
let path   = require('path');
let waitup = require('waitup');

const EFFECTS_DIRECTORY = __dirname + '/../effects';

const SUBEFFECTS_DIRECTORY = __dirname + '/../subeffects';

const INITIAL_STATE = {
  busy:           false,
  end:            false,
  lightBusy:      false,
  subeffectsBusy: false
};

class Manager {
  constructor() {
    this.lightClient = new huejay.Client({
      host:     '10.0.1.2',
      username: '358101e648c0dc71c10ab4a3c4b8cfb'
    });

    this.soundClient = new Afplay;
    this.state = Object.assign({}, INITIAL_STATE);
  }

  start() {
    this.registerSigHandler();
    this.registerEffects();
    this.registerSubeffects();
    this.startEffects();
    this.spawnSubeffects();
  }

  get busy() {
    return this.state.busy;
  }

  set busy(state) {
    this.logManager(`Busy: ${state}`);

    this.state.busy = Boolean(state);
  }

  get lightBusy() {
    return this.state.lightBusy;
  }

  set lightBusy(state) {
    this.logManager(`Light busy: ${state}`);

    this.state.lightBusy = Boolean(state);
  }

  get subeffectsBusy() {
    return this.state.subeffectsBusy;
  }

  set subeffectsBusy(state) {
    this.logManager(`Subeffects busy: ${state}`);

    this.state.subeffectsBusy = Boolean(state);
  }

  get end() {
    return this.state.end;
  }

  set end(state) {
    this.logManager(`Ending cycler: ${state}`);

    this.state.end = Boolean(state);
  }

  registerSigHandler() {
    process.stdin.resume()

    process.on('SIGINT', () => {
      this.logManager('Exiting');
      this.busy = true;
      this.end = true;

      process.exit(1);
    });
  }

  registerEffects() {
    this.logManager(`Loading effects...`);

    this.effects = [];

    let effectPlugins = fs.readdirSync(EFFECTS_DIRECTORY)
      .filter(file => {
        return fs.statSync(path.join(EFFECTS_DIRECTORY, file)).isDirectory();
      });

    for (let i in effectPlugins) {
      this.logManager('Effect found: ' + chalk.black.bgGreen(effectPlugins[i]));
      this.effects.push(effectPlugins[i]);
    }
  }

  registerSubeffects() {
    this.logManager(`Loading subeffects...`);

    this.subeffects = [];

    let subeffectPlugins = fs.readdirSync(SUBEFFECTS_DIRECTORY)
      .filter(file => {
        return fs.statSync(path.join(SUBEFFECTS_DIRECTORY, file)).isDirectory();
      });

    for (let i in subeffectPlugins) {
      this.logManager('Subeffect found: ' + chalk.black.bgYellow(subeffectPlugins[i]));
      this.subeffects.push(subeffectPlugins[i]);
    }
  }

  startEffects() {
    this.logManager('Starting effects cycler');

    waitup({
      for: waitee => {
        if (this.busy !== true && this.lightBusy !== true) {
          return this.invokeRandomEffect();
        }

        if (this.end === true) {
          return waitee.done();
        }
      },
      delay: 100
    });
  }

  spawnSubeffects() {
    waitup({
      for: waitee => {
        if (this.subeffectsBusy !== true) {
          this.subeffectsBusy = true;

          waitup({
            for: waitee => {
              this.invokeRandomSubeffect();

              return waitee.done();
            },
            delay: Math.floor(Math.random() * (1 + 9000 - 2000)) + 2000,
            maxTries: 1
          });
        }

        if (this.end === true) {
          return waitee.done();
        }
      },
      delay: 100
    })
  }

  invokeRandomEffect() {
    if (this.lightBusy === true) {
      this.effectsBusy = false;
      return;
    }

    let index = Math.floor(Math.random() * this.effects.length);
    let effectPlugin = this.effects[index];
    let effect = require(EFFECTS_DIRECTORY + '/' + effectPlugin + '/Instructions');
    let instructions = new effect(this);

    this.logManager('Running effect: ' + chalk.black.bgGreen(effectPlugin));

    this.lightBusy = true;

    instructions.invoke();
  }

  invokeRandomSubeffect() {
    if (this.lightBusy === true) {
      this.subeffectsBusy = false;
      return;
    }

    let index = Math.floor(Math.random() * this.subeffects.length);
    let subeffectPlugin = this.subeffects[index];
    let subeffect = require(SUBEFFECTS_DIRECTORY + '/' + subeffectPlugin + '/Instructions');
    let instructions = new subeffect(this);

    this.logManager('Running subeffect: ' + chalk.black.bgYellow(subeffectPlugin));

    this.lightBusy = true;

    instructions.invoke();
  }

  logManager(text) {
    console.log(chalk.green('Manager: ') + chalk.white(text));
  }

  logLight(text) {
    console.log(chalk.cyan('Light: ') + chalk.white(text));
  }

  logSound(text) {
    console.log(chalk.magenta('Sound: ') + chalk.white(text));
  }

  logError(text) {
    console.log(chalk.red('Error: ') + chalk.white(text));
  }
}

module.exports = Manager;
