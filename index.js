#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const config = require('./app/config');
const ManifestFactory = require('./app/manifest-factory');
const CommandInvoker = require('./app/command-invoker');
const zfs = require('./app/zfs');
const Jail = require('./app/jail');
const JailConfig = require('./app/jail-config');
const ruleViewVisitor = require('./app/rule-view-visitor');
const umount = require('./app/umount');
const mountNullfs = require('./app/mount-nullfs');

const MANIFEST_NAME = 'manifest.json';

const argv = yargs
    .option('m', {
        alias: 'manifest',
        default: './jmakefile.yml',
    })
    .option('f', {
        alias: 'force',
        type: 'boolean',
        default: false,
    })
    .option('c', {
        alias: 'context',
        default: './',
    })
    .demandOption(['manifest', 'context'])
    .argv;

(async _ => {

    console.log(config);

    let file = path.resolve(argv.manifest);
    let manifest = ManifestFactory.fromYamlFile(file);
    let clonedManifest = manifest.clone();
    let invoker = new CommandInvoker;
    let submitOrUndoAll = invoker.submitOrUndoAll.bind(invoker);
    let newDataset = path.join(config.containersLocation, manifest.name);

    if (zfs.has(newDataset) && !argv.force) {

        let message = `dataset "${manifest.name}"
        already exists, use -f for force create.`;

        throw new Error(message);

    } else if (zfs.has(newDataset) && argv.force) {

        zfs.destroy(newDataset);

    }

    console.log(newDataset);

    if (!manifest.from) 
        throw new Error(`field "from" is empty.`);

    let fromDataset = "";

    {
        let regex = /^(\w+)(\-([\w\.]+))?$/;
        let matches = manifest.from.match(regex);

        if (!matches) throw new Error('incorrect from.');

        let [_1, from, _2, version] = matches;
        fromDataset = path.join(config.containersLocation, from);
    }

    if (!zfs.has(fromDataset)) {

        console.log(`dataset for container "${manifest.from}" not exists.`)
        console.log(`fetching container "${manifest.from}" from remote repository.`)

        let result = spawnSync('pkg', [
            'install', '-y', manifest.from,
        ], { stdio: 'inherit' });

        if (result.status) {

            let msg = `container "${manifest.from}" not found in remote repository.`;
            throw new Error(msg);

        }

    }

    zfs.ensureSnapshot(fromDataset, config.specialSnapName);
    await submitOrUndoAll({
        exec() {
            zfs.clone(fromDataset, config.specialSnapName, newDataset);
        },
        unExec() {
            zfs.destroy(newDataset);
        },
    });

    let [

        datasetPath,
        fromDatasetPath,

    ] = await submitOrUndoAll(_ => {

        return [
            zfs.get(newDataset, 'mountpoint'),
            zfs.get(fromDataset, 'mountpoint'),
        ];

    });

    let manifestOutPath = path.join(datasetPath, MANIFEST_NAME);
    let fromManifestOutPath = path.join(fromDatasetPath, MANIFEST_NAME);
    let srcContextPath = path.resolve(argv.context);
    let contextPath = path.join(datasetPath, '/media/context');
    let jailConfigFile = Jail.confFileByName(manifest.name);
    let fromManifest = await submitOrUndoAll(_ => {
        return ManifestFactory.fromJsonFile(fromManifestOutPath);
    });


    {

        let {osreldate, osrelease} = fromManifest.rules;

        if (!osreldate || !osrelease)
            throw new Error('not set "osreldate" or "osrelease" in base container.');

        manifest.rules.osreldate = osreldate;
        manifest.rules.osrelease = osrelease;
        manifest.rules.persist = true;

    }

    let rules = {...manifest.rules};

    rules['ip4.addr'] = [];
    rules['ip6.addr'] = [];
    rules.ip4 = "inherit";
    rules.ip6 = "inherit";
    rules.path = datasetPath;

    let jailConfig = new JailConfig(manifest.name, rules);
    jailConfig.accept(ruleViewVisitor);
    process.on('exit', _ => fs.unlinkSync(jailConfigFile));
    jailConfig.save(jailConfigFile);

    await fse.ensureDir(contextPath);

    await submitOrUndoAll(_ => {
        process.on('exit', _ => umount(contextPath, true));
        mountNullfs(srcContextPath, contextPath, ['ro']); 
    });

    await submitOrUndoAll({
        exec() { Jail.start(manifest.name); },
        unExec() { Jail.stop(manifest.name); },
    });

    {

        let CommandClass = require('./app/builder-commands/workdir-command');
        let command = new CommandClass({
            index: 0,
            dataset: newDataset,
            datasetPath,
            context: contextPath,
            manifest,
            args: manifest.workdir,
        });

        await submitOrUndoAll(command);

    }


    for (let index in manifest.building) {

        let obj = manifest.building[index];
        let commandName = Object.keys(obj)[0];
        let args = obj[commandName];

        let commandPath = `./app/builder-commands/${commandName}-command`;
        let CommandClass = await submitOrUndoAll(_ => require(commandPath));
        let command = new CommandClass({
            index,
            dataset: newDataset,
            datasetPath,
            context: contextPath,
            manifest,
            args,
        });

        await submitOrUndoAll(command);

    }

    Jail.stop(manifest.name);
    manifest.toFile(manifestOutPath);
    zfs.snapshot(newDataset, config.specialSnapName);

})();
