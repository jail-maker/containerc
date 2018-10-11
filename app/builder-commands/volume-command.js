'use strict';

const { spawnSync } = require('child_process');
const { ensureDir, copy } = require('fs-extra');
const fs = require('fs');
const path = require('path');
const uuidv5 = require("uuid/v5");
const mountNullfs = require('../mount-nullfs');
const umount = require('../umount');
const CommandInterface = require('../command-interface');
const config = require('../config');
const zfs = require('../zfs');
const foldersSync = require('../folders-sync');

class VolumeCommand extends CommandInterface {

    constructor(receiver) {

        super();
        this._receiver = receiver;
        this._mountPath = null;

    }

    _normalizeArgs(args = {}) {

        const template = {
            name: undefined,
            to: undefined,
        };

        if (typeof(args) === 'string') 
            args = { to: args };

        return Object.assign(template, args);

    }

    async exec() {

        let {
            dataset,
            datasetPath,
            manifest,
            args = {},
        } = this._receiver;

        zfs.ensureDataset(config.volumesLocation);

        args = this._normalizeArgs(args);

        if (args.to === undefined)
            throw new Error('volume argument "to" is undefined.');

        if (args.name === undefined)
            args.name = uuidv5(`${dataset} ${args.to}`, uuidv5.DNS);

        manifest.volumes.push(args);

        let dst = args.to;
        dst = path.resolve(manifest.workdir, dst);
        let mountPath = path.join(datasetPath, dst);
        let volumeDataset = path.join(config.volumesLocation, args.name);
        let src = null;

        await ensureDir(mountPath);

        if (zfs.has(volumeDataset)) {

            src = zfs.get(volumeDataset, 'mountpoint');

        } else {

            zfs.ensureDataset(volumeDataset);
            src = zfs.get(volumeDataset, 'mountpoint');
            await foldersSync(path.join(mountPath, '/'), path.join(src, '/'));

        }

        this._mountPath = mountPath;

        let {uid, gid} = fs.statSync(mountPath);
        fs.chownSync(src, uid, gid);

        mountNullfs(src, mountPath);
        process.on('exit',  _ => umount(this._mountPath, true));

    }

    async unExec() { }

}

module.exports = VolumeCommand;
