'use strict';

//Init Electron functions.
var app = require('electron').app;
var BrowserWindow = require('electron').remote.BrowserWindow;
var ipcRenderer = require('electron').ipcRenderer;
var dialog = require('electron').dialog;
var remote = require('electron').remote;

//Init NodeJS functions.
var exec = require('child_process').exec;
var path = require('path');

//Init NPM package functions.
var fs = require('fs-extra');
var arraySort = require('array-sort');

//Init databases.
var gameDbUri = __dirname + "/data/games.json";
var emuDbUri = __dirname + "/data/emulators.json";
var sysDbUri = __dirname + "/data/systems.json";
var settingsDbUri = __dirname + "/settings/settings.json";

console.log(gameDbUri + "\n" + emuDbUri + "\n" + sysDbUri);

var settingsDb = JSON.parse(loadGamesList(__dirname + "/settings/settings.json"));

//Init global variables.
var sortOrder = settingsDb.sortOrder;
var descending = settingsDb.descending;
var filterType = settingsDb.groupType;
var filterBy = settingsDb.filterBy;
var invalidEntries = 0;

//This function loads a given JSON file. The file URI is passed to the function.
function loadGamesList(uri) {
  var jsUri = uri;
  var jsText = fs.readFileSync(jsUri);
  return jsText;
}

//This function uses loadGamesList() to parse the user's list of games, then displays them in the main window.
function showMeTheGames() {
  var jsdb = JSON.parse(loadGamesList(gameDbUri));
  //Sort by a given order. 'Desc' must be a boolean.
  console.log(arraySort(jsdb.games_list,sort_order,0));

  var htm, dataLength, i;
  htm = "";
  //Store list length in a variable, so we don't have to recalculate each time.
  dataLength = jsdb.games_list.length;

  //For every game, add HTML to the htm variable...
  for (i=0; i < dataLength; i++) {
    htm += "<li>" + jsdb.games_list[i].title + "</li>"
  }

  alert(htm);
  //...then inject it into the main HTML document.
  document.getElementsByClassName("list-ul")[0].innerHTML = htm;
}

//This function is basically the same as showMeTheGames, but filters the games.
function filterMeTheGames(order,desc) {
  var jsdb = JSON.parse(loadGamesList(gameDbUri));
  //Sort by a given order. 'Desc' must be a boolean.
  console.log(arraySort(jsdb.games_list,order,{reverse:desc}));

  var htm, dataLength, i;
  htm = "";
  //filterBy = specific keyword, e.g. 'FPS'. Systems use IDs, genres use words.
  if(filterBy!="") {
    var jsdbFiltered;

    switch(filterType) {
      case("system_id"):
        console.log("Filtering by system with ID " + filterBy + ".");
        jsdbFiltered = jsdb.games_list.filter(filterBySystem);
        break;
      case("genre"):
        console.log("Filtering by " + filterBy + ".");
        jsdbFiltered = jsdb.games_list.filter(filterByGenre);
        break;
      default:
        console.log("No filter selected.");
        jsdbFiltered = jsdb.games_list;
        break;
    }

    //Store list length in a variable, so we don't have to recalculate each time.
    dataLength = jsdbFiltered.length;

    //For every game, add HTML to the htm variable...
    for (i=0; i < dataLength; i++) {
      htm += "<span class='game' onclick='changeBackground(\"" + encodeURI(jsdbFiltered[i].background) + "\")' style='background-image:url(\"" + encodeURI(jsdbFiltered[i].box_art) + "\");' data-id='" + jsdbFiltered[i].id + "' ondblclick='launchGame(" + jsdbFiltered[i].id + ")' onmousedown='removeGame(" + jsdbFiltered[i].id + ")'>"
      htm += "<p>" + jsdbFiltered[i].title + "</p>"
      htm += "</span>";
    }
  } else {
    console.log("No filter selected.")
    //Store list length in a variable, so we don't have to recalculate each time.
    dataLength = jsdb.games_list.length;

    //For every game, add HTML to the htm variable...
    for (i=0; i < dataLength; i++) {
      htm += "<span class='game' onclick='changeBackground(\"" + encodeURI(jsdb.games_list[i].background) + "\")' style='background-image:url(\"" + encodeURI(jsdb.games_list[i].box_art) + "\");' data-id='" + jsdb.games_list[i].id + "' ondblclick='launchGame(" + jsdb.games_list[i].id + ")' onmousedown='removeGame(" + jsdb.games_list[i].id + ")'>"
      htm += "<p>" + jsdb.games_list[i].title + "</p>"
      htm += "</span>";
    }
  }
  //...then inject it into the main HTML document.
  document.getElementById("games").innerHTML = htm;
}

function isFilter(obj) {
  return obj === filterBy && typeof(obj) === "string";
}

function filterBySystem(item) {
  if (isFilter(item.system_id)) {
    return true;
  }
  invalidEntries++;
  return false;
}

function filterByGenre(item) {
  if (isFilter(item.genre)) {
    return true;
  }
  invalidEntries++;
  return false;
}

function changeFilters(type,by) {
  filterType = type;
  filterBy = by;
  filterMeTheGames(sortOrder,descending)
}

function sortGames(order,desc) {
  sortOrder = order;
  descending = desc;
  filterMeTheGames(sortOrder,descending)
}

function changeSettings(name,value) {
  settingsDb.name = value;
}

//This function uses loadGamesList() to parse the user's list of systems, then displays them in the sidebar.
function showMeTheSystems() {
  var jsdb = JSON.parse(loadGamesList(sysDbUri));
  console.log(arraySort(jsdb.systems_list,"sort_order"));

  var htm, dataLength, i;
  //The HTML includes 'All Games' by default. Makes sense to me.
  htm = "<li onclick='changeFilters(\"system_id\",\"\")'>All Games</li>";
  dataLength = jsdb.systems_list.length;

  //For every system entry, add a list element.
  for (i=0; i < dataLength; i++) {
    htm += "<li onclick='changeFilters(\"system_id\",\"" + jsdb.systems_list[i].id + "\")'>" + jsdb.systems_list[i].title + "</li>"
  }

  document.getElementById("sidebar-list").innerHTML = htm;

  //This next part adds the system entries to the 'add a game' form.
  var listHtm = "";

  for (i=0; i < dataLength; i++) {
    listHtm += "<option value=\"" + jsdb.systems_list[i].id + "\">" + jsdb.systems_list[i].title + "</option>"
  }

  document.getElementById("system-selection").innerHTML = listHtm;
}

//This function is the same as the other two, except (for now) it only shows the emulators in the list when adding a game.
function showMeTheEmulators() {
  var jsdb = JSON.parse(loadGamesList(emuDbUri));
  console.log(arraySort(jsdb.emulators_list,"id"));

  var listHtm, dataLength, i;
  listHtm = "";
  dataLength = jsdb.emulators_list.length;

  for (i=0; i < dataLength; i++) {
    listHtm += "<option value=\"" + jsdb.emulators_list[i].id + "\">" + jsdb.emulators_list[i].title + "</option>"
  }

  document.getElementById("emulator-selection").innerHTML = listHtm;
}

//This function is only used on startup, to display everything at once. Probably totally redundant, but it's the only way I know!
function showMeTheStuff() {
  filterMeTheGames(sortOrder,descending);
  showMeTheSystems();
  showMeTheEmulators();
}

//This function launches a game.
function launchGame(gameId) {
  //Load game and emulator databases.
  var gamedb, emudb;
  gamedb = JSON.parse(loadGamesList(gameDbUri));
  emudb = JSON.parse(loadGamesList(emuDbUri));

  //Find out which emulator the game uses, as well as the game's full path and custom commands, based on its unique ID.
  var emuId, gamePath, custom;

  gamedb.games_list.map(function(gameItem) {
    if (gameItem.id == gameId) {
      emuId = gameItem.emulator_id;
      gamePath = gameItem.full_path;
      custom = gameItem.custom_commands;
    }
  });
  console.log(gameId + "\n" + emuId + "\n" + gamePath + "\n" + custom);

  //Fetch emulator path and command syntax from the database.
  var emuPath, syntax;

  emudb.emulators_list.map(function(emuItem) {
    if (emuItem.id == emuId) {
      emuPath = emuItem.full_path;
      syntax = emuItem.syntax;
    }
  });

  //Construct command, replacing parts of syntax string with paths etc.
  var cmd1, cmd2, cmd3, command;

  cmd1 = syntax.replace("%E","\"" + emuPath + "\"");
  cmd2 = cmd1.replace("%G","\"" + gamePath + "\"");

  if (custom == undefined) {
    cmd3 = cmd2.replace("%C","");
  } else {
    cmd3 = cmd2.replace("%C",custom);
  }

  //Trim final command and log it so we know it's working.
  command = cmd3.trim();
  console.log("Launching " + command + "...");

  //Execute the command. If we're playing a native game (e.g. Windows), change the working directory first.
  if (emuId == 0) {
    //Remove game.exe from path to get the game's directory.
    var workDir = path.dirname(command);
    console.log(workDir.replace("\"",""));
    exec(command, {
      cwd: workDir.replace("\"","")
    }, (error, stdout, stderr) => {
      if(error) {
        console.log(error);
      }

      console.log(stdout);
      console.log(stderr);
    });
  } else {
    exec(command, (error, stdout, stderr) => {
      if(error) {
        console.log(error);
      }

      console.log(stdout);
      console.log(stderr);
    });
  }
};

//This function removes a game from the list.
function removeGame(gameId) {
  //Check if right mouse button was pressed, since it's called from onmousedown.
  if(event.which == 3) {
    //Load game database.
    var gamedb;
    gamedb = JSON.parse(loadGamesList(gameDbUri));

    console.log("Deleting game with ID " + gameId + "...");

    //Find the game via its ID, and remove its entry.
    gamedb.games_list.map(function(gameItem) {
      if (gameItem.id == gameId) {
        var gameTitle = gameItem.title;
        var gameIndex = gamedb.games_list.indexOf(gameItem);
        gamedb.games_list.splice(gameIndex,1);
        console.log("Game " + gameTitle + " deleted from database.")

        //Convert amended database back to JSON...
        var jsdbNew = JSON.stringify(gamedb, null, " ");
        //...and rewrite our JSON with the new data.
        fs.writeFileSync(gameDbUri, jsdbNew, "utf8");

        filterMeTheGames(sortOrder,descending);
      }
    });
  }
};

//This function changes the main window's background image, based on the currently-selected game. Exciting, huh?
function changeBackground(uri) {
  //Right now, it literally just changes the background. Future plans: make it fade in and out. Background images can't be faded with CSS3, so another method is needed.
  document.getElementById("backdrop").style.backgroundImage =
    "url('" + uri + "')";
}

//This function previews uploaded boxart/background images.
function previewImage(formClass,imgClass) {
  var img = document.getElementsByClassName(formClass)[0].files[0].path;
  var imgenc = encodeURI(img);

  var uri = imgenc.replace(/%5C/g,"/");

  document.getElementsByClassName(imgClass)[0].style.backgroundImage =
    "url(\"" + uri + "\")";
}

//This function takes a game's full path and copies it to the input box.
function getFilePath(formId,textClass) {
  var path = document.getElementById(formId).files[0].path;
  document.getElementsByClassName(textClass)[0].value = path;
}

//This function automatically fills the 'sort order' box with the title.
function fillSortOrder(formNo) {
  var val = document.getElementsByClassName("form-ti")[formNo].value;
  document.getElementsByClassName("form-so")[formNo].value = val;
}

//Many thanks to https://code.lengstorf.com/get-form-values-as-json/ for this function, which turns form data into a useful JavaScript object!
const formToJSON = elements => [].reduce.call(elements, (data, element) => {

  if (isValidElement(element)) {
    data[element.name] = element.value;
  };

  return data;
}, {});

//This function pinches data from the modal form, and uses it to add a new game.
function formHandler(event) {
  //Prevent the 'submit' button from...er, submitting.
  event.preventDefault();

  var id = Date.now();
  document.getElementsByClassName("form-sb")[0].value = id;

  var data = formToJSON(form.elements);

  var boxImg = copyImage("form-ba",id + "-box");
  var bgImg = copyImage("form-bg",id + "-bg");
  data.box_art = boxImg;
  data.background = bgImg;

  //...and, as if by magic, what was once a JSON array is now a JS object.
  var jsdb = JSON.parse(loadGamesList(gameDbUri))

  //Add fresh form data to the object
  jsdb.games_list.push(data);

  var jsdbNew = JSON.stringify(jsdb, null, " ");

  //Rewrite our JSON with the new data.
  fs.writeFileSync(gameDbUri, jsdbNew, "utf8");

  //Reload the games list and close the modal while we're at it.
  filterMeTheGames(sortOrder,descending);
  resetForm("form-game");
  //Reset preview images
  document.getElementsByClassName("boxart-thumb")[0].style.backgroundImage =
    "none";
  document.getElementsByClassName("background-thumb")[0].style.backgroundImage =
    "none";

  window.location.hash = "#"
}

function formHandlerSys(event) {
  //Prevent the 'submit' button from...er, submitting.
  event.preventDefault();

  var id = Date.now();
  document.getElementsByClassName("form-sbs")[0].value = id;

  var data = formToJSON(formS.elements);

  //...and, as if by magic, what was once a JSON array is now a JS object.
  var jsdb = JSON.parse(loadGamesList(sysDbUri))

  //Add fresh form data to the object
  jsdb.systems_list.push(data);

  var jsdbNew = JSON.stringify(jsdb, null, " ");

  //Rewrite our JSON with the new data.
  fs.writeFileSync(sysDbUri, jsdbNew, "utf8");

  //Reload the systems list and close the modal while we're at it.
  showMeTheSystems();
  resetForm("form-system");

  window.location.hash = "#"
}

function formHandlerEmu(event) {
  //Prevent the 'submit' button from...er, submitting.
  event.preventDefault();

  var id = Date.now();
  document.getElementsByClassName("form-sbe")[0].value = id;

  var data = formToJSON(formE.elements);

  //...and, as if by magic, what was once a JSON array is now a JS object.
  var jsdb = JSON.parse(loadGamesList(emuDbUri))

  //Add fresh form data to the object
  jsdb.emulators_list.push(data);

  var jsdbNew = JSON.stringify(jsdb, null, " ");

  //Rewrite our JSON with the new data.
  fs.writeFileSync(emuDbUri, jsdbNew, "utf8");

  //Reload the systems list and close the modal while we're at it.
  showMeTheEmulators();
  resetForm("form-emulator");

  window.location.hash = "#"
}

function isValidElement(element) {
  return element.name && element.value;
}

function copyImage(formClass,finalName) {
  var imgOrig = document.getElementsByClassName(formClass)[0].files[0].path;
  var mimeType = document.getElementsByClassName(formClass)[0].files[0].type;
  var ext = "";

  switch(mimeType) {
    case("image/png"):
      ext = ".png";
      break;
    case("image/jpeg"):
      ext = ".jpg";
      break;
    case("image/gif"):
      ext = ".gif";
      break;
    case("image/tiff"):
      ext = ".tif";
      break;
    default:
      ext = ".jpg";
      break;
  }

  fs.copySync(imgOrig,"app/images/" + finalName + ext);
  return ("images/" + finalName + ext);
}

function resetForm(formClass) {
  document.getElementsByClassName(formClass)[0].reset();
}

const form = document.getElementsByClassName('form-game')[0];
form.addEventListener('submit', formHandler);

const formS = document.getElementsByClassName('form-system')[0];
formS.addEventListener('submit', formHandlerSys);

const formE = document.getElementsByClassName('form-emulator')[0];
formE.addEventListener('submit', formHandlerEmu);

/*const manageButton = document.getElementsByClassName('manage-button')[0];
document.addEventListener("DOMContentLoaded", function() {
  console.log("Document loaded.")

  manageButton.addEventListener('click', function() {
    console.log("Opening manager window...");
    var win = new BrowserWindow({
      width: 800,
      height: 550,
      parent: remote.getCurrentWindow(),
      modal: true
    });

    win.setMenu(null);
    win.loadURL('file:///' + __dirname + '/manager.htm');

    win.on('closed', () => {
      win = null;
    });
  })
});*/

//const gameIcons = document.getElementsByClassName('game');

/*for(var i=0; i < gameIcons.length; i++) {
  console.log("Added game " + i);
  var gameId = gameIcons[i].value;
  gameIcons.addEventListener('dblclick', launchGame(gameId));
};*/
