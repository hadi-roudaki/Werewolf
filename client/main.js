var lobbySize = 4;
var totalCount = 0;

var wereWolfNum = 0;
var doxyNum = 0;
var masonicLeaderNum = 0;
var darkMagicianNum = 0;
var werehampsterNum = 0;
var HunterNum = 0;
var GrannyNum = 0;
var VillagerNum = 0;
var WitchNum = 0;
var SeerNum = 0;
var CupidNum = 0;

function roleCount(){
     totalCount = parseInt(wereWolfNum, 10) , parseInt(doxyNum, 10) ,
     parseInt(werehampsterNum, 10) ,parseInt(HunterNum, 10)  , parseInt(GrannyNum, 10) ,
     parseInt(VillagerNum, 10) , parseInt(WitchNum, 10) , parseInt(masonicLeaderNum, 10) ,
     parseInt(SeerNum, 10) , parseInt(CupidNum, 10), parseInt(darkMagicianNum, 10);
     var temp = lobbySize - totalCount;
}

function isValidLobby(){
    if(temp >= 0){
         return true;
    }else{
         return false;
    }
}

Handlebars.registerHelper('toCapitalCase', function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function initUserLanguage() {
  var language = amplify.store("language");

  if (language){
    Session.set("language", language);
  }

  setUserLanguage(getUserLanguage());
}

function getUserLanguage() {
  var language = Session.get("language");

  if (language){
    return language;
  } else {
    return "en";
  }
};

function setUserLanguage(language) {
  TAPi18n.setLanguage(language).done(function () {
    Session.set("language", language);
    amplify.store("language", language);
  });
}

function getLanguageDirection() {
  var language = getUserLanguage()
  var rtlLanguages = ['he'];

  if ($.inArray(language, rtlLanguages) !== -1) {
    return 'rtl';
  } else {
    return 'ltr';
  }
}

function getLanguageList() {
  var languages = TAPi18n.getLanguages();
  var languageList = _.map(languages, function(value, key) {
    var selected = "";
    
    if (key == getUserLanguage()){
      selected = "selected";
    }

    return {
      code: key,
      selected: selected,
      languageDetails: value
    };
  });
  
  if (languageList.length <= 1){
    return null;
  }
  
  return languageList;
}

function getRole(a) {
    for (index = 0; index < characters.length; ++index) {
        if (characters[index].name === a) {
            console.log(characters[index]);
        }
    }
}

function getCurrentGame(){
  var gameID = Session.get("gameID");

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getAccessLink(){
  var game = getCurrentGame();

  if (!game){
    return;
  }

  return Meteor.settings.public.url + game.accessCode + "/";
}


function getCurrentPlayer(){
  var playerID = Session.get("playerID");

  if (playerID) {
    return Players.findOne(playerID);
  }
}

function generateAccessCode(){
  var code = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

    for(var i=0; i < 6; i++){
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
}

function generateNewGame(){
  var game = {
    accessCode: generateAccessCode(),
    state: "waitingForPlayers",
    location: null,
    lengthInMinutes: 8,
    endTime: null,
    paused: false,
    pausedTime: null
  };

  var gameID = Games.insert(game);
  game = Games.findOne(gameID);

  return game;
}

function generateNewPlayer(game, name){
  var player = {
    gameID: game._id,
    name: name,
    role: null,
    isSpy: false,
    isFirstPlayer: false
  };

  var playerID = Players.insert(player);

  return Players.findOne(playerID);
}

function getRandomLocation(){
  var locationIndex = Math.floor(Math.random() * locations.length);
  return locations[locationIndex];
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function assignRoles(players, location){
  var default_role = location.roles[location.roles.length - 1];
  var roles = location.roles.slice();
  var shuffled_roles = shuffleArray(roles);
  var role = null;

  players.forEach(function(player){
    if (!player.isSpy){
      role = shuffled_roles.pop();

      if (role === undefined){
        role = default_role;
      }
      getRole(role);
      Players.update(player._id, {$set: {role: role}});
    }
  });
}

function resetUserState(){
  var player = getCurrentPlayer();

  if (player){
    Players.remove(player._id);
  }

  Session.set("gameID", null);
  Session.set("playerID", null);
}

function trackGameState () {
  var gameID = Session.get("gameID");
  var playerID = Session.get("playerID");

  if (!gameID || !playerID){
    return;
  }

  var game = Games.findOne(gameID);
  var player = Players.findOne(playerID);

  if (!game || !player){
    Session.set("gameID", null);
    Session.set("playerID", null);
    Session.set("currentView", "startMenu");
    return;
  }

  if(game.state === "inProgress"){
    Session.set("currentView", "gameView");
  } else if (game.state === "waitingForPlayers") {
    Session.set("currentView", "lobby");
  }
}

function leaveGame () {  
  GAnalytics.event("game-actions", "gameleave");
  var player = getCurrentPlayer();

  Session.set("currentView", "startMenu");
  Players.remove(player._id);

  Session.set("playerID", null);
}

initUserLanguage();

Meteor.setInterval(function () {
  Session.set('time', new Date());
}, 1000);

Tracker.autorun(trackGameState);

FlashMessages.configure({
  autoHide: true,
  autoScroll: false
});

Template.main.helpers({
  whichView: function() {
    return Session.get('currentView')
  },
  language: function() {
    return getUserLanguage();
  },
  textDirection: function() {
    return getLanguageDirection();
  }
});

Template.footer.helpers({
  languages: getLanguageList
})

Template.footer.events({
  'click .btn-set-language': function (event) {
    var language = $(event.target).data('language');
    setUserLanguage(language);
    GAnalytics.event("language-actions", "set-language-" + language);
  },
  'change .language-select': function (event) {
    var language = event.target.value;
    setUserLanguage(language);
    GAnalytics.event("language-actions", "set-language-" + language);
  }
})

Template.startMenu.events({
  'click #btn-new-game': function () {
    Session.set("currentView", "createGame");
  },
  'click #btn-join-game': function () {
    Session.set("currentView", "joinGame");
  }
});

Template.startMenu.rendered = function () {
  GAnalytics.pageview("/");

  resetUserState();
};

Template.createGame.helpers({
    characters: function () {
    return characters;
  }, 
});

Template.createGame.events({
    'change #lobbyInt' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            lobbySize = number; 
            console.log('WHATS THE LOBBY?'+ lobbySize);
        }
    },
    'change #WereWolf' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            wereWolfNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Doxy' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            doxyNum = number;
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Masonic Leader' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            masonicLeaderNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Dark Magician' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            darkMagicianNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Werehampster' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            wereWolfNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Hunter' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            HunterNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Granny' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            GrannyNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Villager' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            VillagerNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Witch' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            WitchNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Seer' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            SeerNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },
    'change #Cupid' : function(event){
        var number = $(event.target).val();
        if(!isNaN(number) && number){
            CupidNum = number; 
            roleCount();
            console.log(number + 'how many left '+ totalCount);
        }
    },      
    'submit #create-game': function (event) {
        GAnalytics.event("game-actions", "newgame");

    var playerName = event.target.playerName.value;

    if (!playerName) {
      return false;
    }

    var game = generateNewGame();
    var player = generateNewPlayer(game, playerName);

    Session.set("gameID", game._id);
    Session.set("playerID", player._id);
    Session.set("currentView", "lobby");
    return false;
  },
  'click .btn-back': function () {
    Session.set("currentView", "startMenu");
    return false;
  }
});

Template.createGame.rendered = function (event) {
  $("#player-name").focus();
  $("#lobbyInt").val(lobbySize);
  
  $("#WereWolf").val(wereWolfNum);
  $("#Doxy").val(doxyNum);
  $("#Werehampster").val(werehampsterNum);
  $("#Dark_Magician").val(darkMagicianNum);
  $("#Granny").val(GrannyNum);
  $("#Hunter").val(HunterNum);
  $("#Cupid").val(CupidNum);
  $("#Seer").val(SeerNum);
  $("#Witch").val(WitchNum);
  $("#Villager").val(VillagerNum);      
  $("#Masonic_Leader").val(masonicLeaderNum);
};

Template.joinGame.events({
  'submit #join-game': function (event) {
    GAnalytics.event("game-actions", "gamejoin");

    var accessCode = event.target.accessCode.value;
    var playerName = event.target.playerName.value;

    accessCode = accessCode.trim();
    accessCode = accessCode.toLowerCase();
    
    var game = Games.findOne({
      accessCode: accessCode
    });

    if (game) {
      player = generateNewPlayer(game, playerName);

      Session.set("gameID", game._id);
      Session.set("playerID", player._id);
      Session.set("currentView", "lobby");
    } else {
      FlashMessages.sendError(TAPi18n.__("ui.invalid access code"));
    }

    return false;
  },
  'click .btn-back': function () {
    Session.set("currentView", "startMenu");
    return false;
  }
});

Template.joinGame.rendered = function (event) {
  resetUserState();

  var urlAccessCode = Session.get('urlAccessCode');

  if (urlAccessCode){
    $("#access-code").val(urlAccessCode);
    $("#access-code").hide();
    $("#player-name").focus();
    Session.set('urlAccessCode', null);
  } else {
    $("#access-code").focus();
  }
};

Template.lobby.helpers({
  game: function () {
    return getCurrentGame();
  },
  accessLink: function () {
    return getAccessLink();
  },
  player: function () {
    return getCurrentPlayer();
  },
  players: function () {
    var game = getCurrentGame();
    var currentPlayer = getCurrentPlayer();

    if (!game) {
      return null;
    }

    var players = Players.find({'gameID': game._id}).fetch();

    players.forEach(function(player){
      if (player._id === currentPlayer._id){
        player.isCurrent = true;
      }
    });

    return players;
  }
});

Template.lobby.events({
  'click .btn-leave': leaveGame,
  'click .btn-start': function () {
    GAnalytics.event("game-actions", "gamestart");

    var game = getCurrentGame();
    var location = getRandomLocation();
    var players = Players.find({gameID: game._id});
    var localEndTime = moment().add(game.lengthInMinutes, 'minutes');
    var gameEndTime = TimeSync.serverTime(localEndTime);

    var spyIndex = Math.floor(Math.random() * players.count());
    var firstPlayerIndex = Math.floor(Math.random() * players.count());

    players.forEach(function(player, index){
      Players.update(player._id, {$set: {
        isSpy: index === spyIndex,
        isFirstPlayer: index === firstPlayerIndex
      }});
    });

    assignRoles(players, location);
    
    Games.update(game._id, {$set: {state: 'inProgress', location: location, endTime: gameEndTime, paused: false, pausedTime: null}});
  },
  'click .btn-toggle-qrcode': function () {
    $(".qrcode-container").toggle();
  },
  'click .btn-remove-player': function (event) {
    var playerID = $(event.currentTarget).data('player-id');
    Players.remove(playerID);
  },
  'click .btn-edit-player': function (event) {
    var game = getCurrentGame();
    resetUserState();
    Session.set('urlAccessCode', game.accessCode);
    Session.set('currentView', 'joinGame');
  }
});

Template.lobby.rendered = function (event) {
  var url = getAccessLink();
  var qrcodesvg = new Qrcodesvg(url, "qrcode", 250);
  qrcodesvg.draw();
};

function getTimeRemaining(){
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();

  if (game.paused){
    var localPausedTime = game.pausedTime - TimeSync.serverOffset();
    var timeRemaining = localEndTime - localPausedTime;
  } else {
    var timeRemaining = localEndTime - Session.get('time');
  }

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

Template.gameView.helpers({
  game: getCurrentGame,
  player: getCurrentPlayer,
  players: function () {
    var game = getCurrentGame();
    
    if (!game){
      return null;
    }

    var players = Players.find({
      'gameID': game._id
    });

    return players;
  },
  locations: function () {
    return locations;
  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    return moment(timeRemaining).format('mm[<span>:</span>]ss');
  }
});

Template.gameView.events({
  'click .btn-leave': leaveGame,
  'click .btn-end': function () {
    GAnalytics.event("game-actions", "gameend");

    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: 'waitingForPlayers'}});
  },
  'click .btn-toggle-status': function () {
    $(".status-container-content").toggle();
  },
  'click .game-countdown': function () {
    var game = getCurrentGame();
    var currentServerTime = TimeSync.serverTime(moment());

    if(game.paused){
      GAnalytics.event("game-actions", "unpause");
      var newEndTime = game.endTime - game.pausedTime + currentServerTime;
      Games.update(game._id, {$set: {paused: false, pausedTime: null, endTime: newEndTime}});
    } else {
      GAnalytics.event("game-actions", "pause");
      Games.update(game._id, {$set: {paused: true, pausedTime: currentServerTime}});
    }
  }
});
