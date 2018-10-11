'use strict';

const fs = require('fs');
const path = require('path');
const { camel } = require('case');

const ENV_PREFIX = 'JMAKER';
const ENV_REQUIRED = [
    'JMAKER_CONTAINERS_LOCATION',
    'JMAKER_SPECIAL_SNAP_NAME',
];

class Config {

    constructor() {

        this._checkRequired();

        this.reponame = null;
        this.maintainer = "anonymous@localhost";
        this.containersLocation = "zroot/jmaker/containers";
        this.volumesLocation = "zroot/jmaker/volumes";
        this.packagesLocation = "zroot/jmaker/packages";
        this.specialSnapName = "forks";
        this.localNetworkAgentAddr = "http://127.0.0.1:3367";
        this.dnsResolverType = "auto";
        this.dnsResolverAddr = "127.0.0.2";

        this._loadEnv();

    }

    _checkRequired() {

        ENV_REQUIRED.forEach(key => {

            if (process.env[key] === undefined)
                throw new Error(`environment variable "${key}" is not set.`);

        });

    }

    _loadEnv() {

        let exp = new RegExp(`^${ENV_PREFIX}`);

        Object.keys(process.env)
            .forEach(key => {

                if (!key.match(exp)) return;

                let option = camel(key.replace(exp, ''));
                this[option] = process.env[key];

            });

    }

}

module.exports = new Config;
