'use strict';

//Init Electron functions
var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var ipcMain = require('electron').ipcMain;
var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;
var dialog = require('electron').dialog;
var menu = require('electron').Menu;

//Init NodeJS functions
var exec = require('child_process').exec;
var path = require('path');

//Init NPM package functions
var fs = require('fs-extra');
var arraySort = require('array-sort');

//Initialise main window and open said window

var mainWindow = null;

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    height: 720,
    width: 1280
  });

  mainWindow.loadURL('file://' + __dirname + '/app/index.htm');

  //Remove top menu bar - we'll add our own in-app menu later
  //mainWindow.setMenu(null);
});

//IPC allows rendered windows to communicate with the main process.

var settingsWindow = null;

ipcMain.on('open-manager-window', function () {
  if (settingsWindow) {
    return;
  }

  settingsWindow = new BrowserWindow({
    height: 800,
    width: 480,
    resizable: true
  });

  settingsWindow.loadURL('file://' + __dirname + '/app/manager.htm');

  settingsWindow.on('closed', function () {
    settingsWindow = null;
  });
});
