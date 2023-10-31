#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require("yargs");
const { exec } = require('child_process');

const axios = require("axios");

const options = yargs.usage(
"Usage:\n\
--test <Build flag> Development builds\n\
--release <Build flag> Release builds")
.option("t", {
    alias: "test",
    describe: "Build flag. Open's the application using dioxus-web. Intended for hot-reloading support for ease of development.",
    type: "flag",
})
.option("r", {
    alias: "release",
    describe: "Build flag. Open's the application using dioxus-desktop.",
    type: "flag",
})
.check((argv) => {
    // Check if both 'test' and 'release' options are provided
    if (argv.t == null && argv.r == null){
        throw new Error('Specify a build flag.');
    }
    if (argv.t && argv.r) {
        throw new Error('Options -test and -release cannot be used together in the same command.');
    }
    return true; // Validation passed
})
.argv;

const dioxusCli = ['dioxus-cli', 'dx.exe'];

// Check if dioxus-cli is installed
exec('cargo install --list', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing the command: ${error.message}`);
        return;
    }
  
    // Split the command output into an array of installed packages
    const installedPackages = stdout.split('\n');
  
    // Check if any of the specified params are substrings of globally installed cargos
    const isDioxusCliInstalled = dioxusCli.some((package) =>
    installedPackages.some((packageName) => packageName.includes(package))
    );
    
    if (isDioxusCliInstalled) {
        console.log(`${dioxusCli[0]} is installed.`);
    } else {
        throw new Error(`${dioxusCli} is not installed.`);
    }
    
    if (options.test) {
        console.log(`Running test build...`)
    
        const targetFileName = 'Cargo.toml';
        const currentDirectory = process.cwd();
    
        // Check if the file exists in the current directory
        const filePath = path.join(currentDirectory, targetFileName);
        fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`LessonLab CLI Error: Failed to find directory containing ${targetFileName}.`);
        } else {
            console.log(`Success.`);
        }
        });
    } 
});