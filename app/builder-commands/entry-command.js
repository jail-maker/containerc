'use strict';

const CommandInterface = require('../command-interface');

class EntryCommand extends CommandInterface {

    constructor(receiver) {

        super();

        let { manifest } = receiver;

        this._receiver = receiver;
        this._entry = manifest.entry;

    }

    async exec() {

        let {
            manifest,
            args = [],
        } = this._receiver;

        manifest.entry = args;

    }

    async unExec() {

        let { manifest } = this._receiver;
        manifest.entry = this._entry;

    }

}

module.exports = EntryCommand;
