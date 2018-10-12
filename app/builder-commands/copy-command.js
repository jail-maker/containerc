'use strict';

const path = require('path');
const { copy, copySync, unlinkSync } = require('fs-extra');
const CommandInterface = require('../command-interface');
const zfs = require('../zfs');

class CopyCommand extends CommandInterface {

    constructor(receiver) {

        super();

        this._receiver = receiver;
        this._copiedFile = null;

    }

    async exec() {

        let {
            dataset,
            datasetPath,
            rootFSPath,
            index,
            manifest,
            context,
            args,
        } = this._receiver;

        if (typeof(args) === 'string') 
            args = [args, args];

        let [src, dst] = args;

        src = path.join(context, path.resolve('/', src));
        dst = path.join(rootFSPath, path.resolve(manifest.workdir, dst));

        copySync(src, dst);
        this._copiedFile = dst;

    }

    async unExec() {

        if (this._copiedFile) unlinkSync(this._copiedFile);

    }

}

module.exports = CopyCommand;
