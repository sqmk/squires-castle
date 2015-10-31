'use strict';

let waitup = require('waitup');

const SOUND_FILE = __dirname + '/sound.mp3';
const LIGHT_ID = 4;

class Instructions {
  constructor(manager) {
    this.manager = manager;
  }

  invoke() {
    this.manager.busy = true;

    this.manager.lightClient.getLight(LIGHT_ID)
      .then(light => {
        this.manager.logLight(`Loaded light ${light.id}`);

        this.light = light;
      })
      .then(() => {
        this.manager.logSound(`Playing ${SOUND_FILE}`);

        this.manager.soundClient.play(SOUND_FILE)
          .then(() => {
            this.manager.logSound(`Done playing ${SOUND_FILE}`);

            this.manager.busy = false;
          });
      })
      .then(() => waitup(950))
      .then(() => this.lightStart())
      .then(() => waitup(100))
      .then(() => this.lightLow())
      .then(() => waitup(100))
      .then(() => this.lightHigh())
      .then(() => waitup(100))
      .then(() => this.lightOff())
      .then(() => this.lightCleanup())
      .catch(error => {
        this.manager.logError(error.stack);
      });
  }

  lightStart() {
    this.manager.logLight(`Turning light ${this.light.id} on`);

    this.light.on             = true;
    this.light.brightness     = 254;
    this.light.colorTemp      = 153;
    this.light.transitionTime = 0;

    return this.manager.lightClient.saveLight(this.light);
  }

  lightLow() {
    this.manager.logLight(`Turning light ${this.light.id} low`);

    this.light.brightness     = 1;
    this.light.transitionTime = 0;

    return this.manager.lightClient.saveLight(this.light);
  }

  lightHigh() {
    this.manager.logLight(`Turning light ${this.light.id} high`);

    this.light.brightness     = 254;
    this.light.transitionTime = 0;

    return this.manager.lightClient.saveLight(this.light);
  }

  lightOff() {
    this.manager.logLight(`Turning light ${this.light.id} off`);

    this.light.on             = false;
    this.light.transitionTime = 0;

    return this.manager.lightClient.saveLight(this.light);
  }

  lightCleanup() {
    this.manager.logLight(`Cleaning up light ${this.light.id}`);

    this.light.on             = false;
    this.light.transitionTime = 0;

    return waitup(3000)
      .then(this.manager.lightClient.saveLight(this.light))
      .then(() => {
        this.manager.lightBusy = false;
      });
  }
}

module.exports = Instructions;
