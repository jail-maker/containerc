'use strict';

class CommandInvoker {

    constructor() {

        this._commands = [];
        this._undoCommands = [];

    }

    _wrapFn(fn) {

        return {
            exec() { return fn(); },
            unExec() {},
        }

    }

    async submit(command) {

        try {

            if (typeof(command) === 'function') {

                command = this._wrapFn(command);

            }

            this._undoCommands = [];
            this._commands.push(command);
            return await command.exec();

        } catch (error) {

            console.log(error);
            await this.undo();
            throw error;

        }

    }

    async submitOrUndoAll(command) {

        try {

            return await this.submit(command);

        } catch (error) {

            await this.undoAll();
            throw error;

        }

    }

    async undoAll() {

        while (this._commands.length) await this.undo();

    }

    async undo() {

        let command = this._commands.pop();
        this._undoCommands.push(command);
        await command.unExec();

    }

    async redo() {

        let command = this._undoCommands.pop();
        this._commands.push(command);
        return await command.exec();

    }

}

module.exports = CommandInvoker;
