#!/usr/bin/env node

const ll_logr = require('./lessonlab-logger.js');

const chalk = require("chalk");
// const boxen = require("boxen");
const fs = require('fs');
const path = require('path');
const yargs = require("yargs");
const {exec} = require('child_process');

const axios = require("axios");

const options = yargs.usage("Usage:\n\
 -- test < Build flag > Development builds\n\ -- release < Build flag > Release builds ")
.option("t", {
    alias: "test",
    describe: "Build flag. Compile the application using dioxus-web. Intended for hot-reloading support for ease of development.",
    type: "flag"
}).option("r", {
    alias: "release",
    describe: "Build flag. Compile the application using dioxus-desktop.",
    type: "flag"
}).option("b", {
    alias: "build",
    describe: "Build flag. Build the application.",
    type: "flag"
})
.check((argv) => {
    // Check if both 'test' and 'release' options are provided
    if (argv.t == null && argv.r == null) {
        ll_logr.ll_error('Specify a build flag!');
        throw new Error('Build Error');
    }
    if (argv.t && argv.r) {
        ll_logr.ll_error('Options --test and --release cannot be used together in the same command!');
        throw new Error('Build Error');
    }
    return true; // Validation passed
}).argv;

const dioxusCli = ['dioxus-cli', 'dx.exe'];

// Check if dioxus-cli is installed
exec('cargo install --list', (error, stdout, stderr) => {
    if (error) {
        ll_logr.ll_error(`Error executing the command: ${
            error.message
        }`);
        process.exit(1); 
    }

    // Split the command output into an array of installed packages
    const installedPackages = stdout.split('\n');

    // Check if any of the specified params are substrings of globally installed cargos
    const isDioxusCliInstalled = dioxusCli.some((package_) => installedPackages.some((packageName) => packageName.includes(package_)));

    if (isDioxusCliInstalled) {
        ll_logr.ll_info(`${dioxusCli[0]} is installed.`);
    } else {
        try {
            throw new Error(`${dioxusCli[0]} is not installed.`);
        } catch (error) {
            const errorMessage = error.message.split('\n')[0]; // Split by line break and select the first line
            ll_logr.ll_error(errorMessage);
        }
        return

    }
    const cargoTarget = 'Cargo.toml';
    const currentDirectory = process.cwd();

    // Check if the file exists in the current directory
    const cargoPath = path.join(currentDirectory, cargoTarget);
    fs.access(cargoPath, fs.constants.F_OK, (err) => {
        if (err) {
            ll_logr.ll_error(`LessonLab CLI Error: Failed to find directory containing ${cargoTarget}.`);
            process.exit(1); 
        } else {
            ll_logr.ll_info(`Found ${cargoTarget}!`);
            ll_logr.ll_trace(`Configuring ${cargoTarget}...`);
        }
    });

    if (options.test) {
        ll_logr.ll_info(`Compiling test build...`);
        
        // Configures the Cargo.toml file
        const cargoToml = fs.readFileSync(cargoTarget, 'utf8');
        const cargoLines = cargoToml.split('\n');
        for (let i = 0; i < cargoLines.length; i++) {
            if (cargoLines[i].includes('default = ["desktop"]')) {
                // Replace 'default = ["desktop"]' with 'default = ["web"]'
                cargoLines[i] = cargoLines[i].replace('default = ["desktop"]', 'default = ["web"]');
            }
        }
        const modifiedCargoToml = cargoLines.join('\n');

        fs.writeFileSync(cargoTarget, modifiedCargoToml, 'utf8');

        if (options.build) {
            const deploy = exec('dx serve --hot-reload', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing the command: ${error.message}`);
                    process.exit(1); 
                }
            
                console.log(stdout);
            });

            deploy.stdout.on('data', (data) => {
                console.log(data);
            });
            
            deploy.stderr.on('data', (data) => {
                console.error(data);
            });
        }     
    } 

    if (options.release) {
        ll_logr.ll_info(`Compiling release build...`);

        const cargoToml = fs.readFileSync(cargoTarget, 'utf8');
        const cargoLines = cargoToml.split('\n');
        for (let i = 0; i < cargoLines.length; i++) {
            if (cargoLines[i].includes('default = ["web"]')) {
                // Replace 'default = ["web"]' with 'default = ["desktop"]'
                cargoLines[i] = cargoLines[i].replace('default = ["web"]', 'default = ["desktop"]');
            }
        }

        // Join the modified lines back into a single string
        const modifiedCargoToml = cargoLines.join('\n');

        fs.writeFileSync(cargoTarget, modifiedCargoToml, 'utf8');

        if (options.build) {
            const deploy = exec('dx serve --hot-reload --platform desktop', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing the command: ${error.message}`);
                    process.exit(1); 
                }
            
                console.log(stdout);
            });
            
            deploy.stdout.on('data', (data) => {
                console.log(data);
            });
            
            deploy.stderr.on('data', (data) => {
                console.error(data);
            });
        } 
    }
});

