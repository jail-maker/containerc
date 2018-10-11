'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const Manifest = require('./manifest');

class ManifestFactory {

    static fromJsonFile(file) {

        let manifest = new Manifest;
        let clearManifest = new Manifest;
        let buffer = fs.readFileSync(file);
        let data = JSON.parse(buffer.toString());

        let keys = Object.keys(manifest);

        keys.forEach(key => {

            if (data[key] !== undefined) manifest[key] = data[key];

        });

        manifest.rules = Object.assign(clearManifest.rules, manifest.rules);
        return manifest;

    }

    static fromYamlFile(file) {

        let manifest = new Manifest;
        let clearManifest = new Manifest;
        let buffer = fs.readFileSync(file);
        let data = yaml.safeLoad(buffer);

        let keys = Object.keys(manifest);

        keys.forEach(key => {

            if (data[key] !== undefined) manifest[key] = data[key];

        });

        manifest.rules = Object.assign(clearManifest.rules, manifest.rules);
        return manifest;

    }

    static fromJsonData(data) {

        let manifest = new Manifest;
        let clearManifest = new Manifest;
        let keys = Object.keys(manifest);

        keys.forEach(key => {

            if (data[key] !== undefined) manifest[key] = data[key];

        });

        manifest.rules = Object.assign(clearManifest.rules, manifest.rules);
        return manifest;

    }

}

module.exports = ManifestFactory;
