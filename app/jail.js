'use strict';

const config = require('./config');
const {spawn, spawnSync} = require('child_process');

class Jail {

    static start(name) {

        let configFile = Jail.confFileByName(name);

        let result = spawnSync('jail', [
            '-c', '-f', configFile, name,
        ], {
            stdio: 'inherit',
        });

        let msg = 'Error execution jail.';
        if (result.status) throw new Error(msg);

    }

    static stop(name) {

        let configFile = Jail.confFileByName(name);

        let result = spawnSync('jail', [
            '-r', '-f', configFile, name,
        ], {
            stdio: 'inherit',
        });

        let msg = 'Error execution jail.';
        if (result.status) throw new Error(msg);

    }

    static restart(name) {

        Jail.stop(name);
        Jail.start(name);

    }

    static confFileByName(name) {

        return `/var/run/${name}-jail.conf`;

    }

    static isWorking(name) {

        let result = spawnSync('jls', [
            '-j', name,
        ]);

        if (result.status) return false;
        else return true;

    }

    static getInfo(name) {

        try {

            let result = spawnSync('jls', [
                '-j', name, '-n', '--libxo=json',
            ]);

            let jsonData = JSON.parse(result.output[1].toString());
            return jsonData['jail-information'].jail[0];

        } catch (error) {

            return {};

        }

    }

}

module.exports = Jail;
