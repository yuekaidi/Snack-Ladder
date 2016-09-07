import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { Players } from '../api/players.js';
import { Status, Game} from '../api/game.js';

import './body.html';

Template.login.events({
  'submit form'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    // Get player name
    var name = event.target.Name.value;
    // Get current number of players
    var id = Players.find().count();
    // Adding player to database
    if (id < 3 && Players.findOne({name: name}) == null) {
      Players.insert({
        index: id,
        name: name,
        score: 0,
      });
    } else if (id == 3 && Players.findOne({name: name}) == null) {
      Players.insert({
        index: id,
        name: name,
        score: 0,
        position: 0
      });
      // When have enough players, initialize status (who to roll)
      Status.insert({
        turn: 0
      })
      // Add 100 element to game
      for (n = 1; n <= 100; n++) {
        Game.insert({
          index: n,
          player: null,
          snake: null,
          ladder: null
        })
      }
      // Add 3 snakes to game, ensure no overlapping snake tail (latter cell)
      var n = 0;
      while (n < 3){
        var head = Math.floor(Math.random() * 99) + 1;
        var tail = Math.floor(Math.random() * (100 - head)) + head;
        var headId = Game.findOne({index: head})._id;
        var tailId = Game.findOne({index: tail})._id;
        if (Game.findOne({index: tail}).snake == null) {
          n++;
          Game.update({_id: tailId}, {$set: {snake: headId}})  
        }
      }
      // Add 3 ladders to game, ensure no overlapping ladder top as well as no overlap with snake tail
      n = 0;
      while (n < 3){
        var bottom = Math.floor(Math.random() * 99) + 1;
        var top = Math.floor(Math.random() * (100 - bottom)) + bottom;
        var bottomId = Game.findOne({index: bottom})._id;
        var topId = Game.findOne({index: top})._id;
        if (Game.findOne({index: bottom}).snake == null && Game.findOne({index: bottom}).ladder == null) {
          n++;
          Game.update({_id: bottomId}, {$set: {ladder: topId}})
        }
      }
    } 
    // Clear form input box
    event.target.Name.value = '';
  }
});

Template.play.onCreated(function playOnCreated() {
  // Initialize die
  this.number = new ReactiveVar(0);
});

Template.play.events({
  'click button'(event, instance) {
    // Roll die
    var die = Math.floor(Math.random() * 6) + 1;
    instance.number.set(die);
    // Identify current player, id, old and new position id, as well as status id for updating purpose
    var currentIndex = Status.find().fetch()[0].turn;
    var nextIndex = (currentIndex + 1) % 4;
    var player = Players.find({index: Status.find().fetch()[0].turn}).fetch()[0];
    var playerPosition = Game.findOne({index: player.score});
    var playerNewPosition = Game.findOne({index: player.score + die});
    var status = Status.findOne();
    //Update database
    //Game finish when one player get to 100
    if (player.score + die >= 100) {
      Players.update({_id: player._id}, {$set: {score: 100}});
      for(n = 0; n < 100; n++){
        Game.remove({_id: Game.findOne()._id});
      }
    } else {
      // When encounter snake, ladder or tie, respond respectively
      while (playerNewPosition.player != null || playerNewPosition.snake != null || playerNewPosition.ladder != null) {
        if (playerNewPosition.player != null) {
          playerNewPosition = Game.findOne({index: playerNewPosition.index - 1});
        }
        if (playerNewPosition.snake != null) {
          playerNewPosition = Game.findOne({_id: playerNewPosition.snake});
        }
        if (playerNewPosition.ladder != null) {
          playerNewPosition = Game.findOne({_id: playerNewPosition.ladder});  
        }
      }
      // This ensure no null object when a user is pushed back to cell 0
      if (player.score > 0) {
        Game.update({_id: playerPosition._id}, {$set: {player: null}});
      }
      Players.update({_id: player._id}, {$set: {score: playerNewPosition.index}});
      Game.update({_id: playerNewPosition._id}, {$set: {player: player._id}});
      Status.update({_id: status._id}, {$set: {turn: nextIndex}});
    }
  },
});

Template.play.helpers({
  // Retrive die number
  number() {
    return Template.instance().number.get();
  },
  // Check if a game is going on
  noGame(){
    return Game.find().count() == 0;
  }
});

Template.restart.events({
  // Clear collections when restart game
  'click button'(event) {
    for(n = 0; n < 4; n++){
      Players.remove({_id: Players.findOne()._id});
    }
    for(n = 0; n < 100; n++){
      Game.remove({_id: Game.findOne()._id});
    }
    Status.remove({_id: Status.findOne()._id});
  }
});

Template.result.helpers({
  //Render all players
  players() {
    return Players.find(); //{ sort: { score: -1 } }
  }
});

Template.player.helpers({
  // Condition to check which is the current turn
  active() {
    return this.index == Status.findOne().turn;
  },
  // Generate css class name
  player() {
    return "player" + this.index;
  }
});

Template.board.helpers({
  // Render all elements on gameboard in index sequence
  boxes() {
    return Game.find({}, { sort: { index: 1 } });
  },
});

Template.box.helpers({
  // Generate class name for different player
  player() {
    if (this.player != null) {
      return "player" + Players.findOne({_id: this.player}).index;
    }
  }
});

Template.detail.events({
  //Jquery for hover effects for snakes and ladders
  "mouseenter .detail" (event) {
    if (this.snake != null){
      var tailDetail = this.index;
      var headDetail = Game.findOne({_id: this.snake}).index;
      $("#"+ headDetail).addClass("pin");
      $("#"+ tailDetail).addClass("snake");
    }   
    else {
      var bottomDetail = this.index;
      var topDetail = Game.findOne({_id: this.ladder}).index;
      $("#"+ topDetail).addClass("pin");
      $("#"+ bottomDetail).addClass("ladder");
    }
  },
  "mouseleave .detail" (event) {
    $(".snake").removeClass("snake");
    $(".ladder").removeClass("ladder");
    $(".pin").removeClass("pin");
  }
});

Template.detail.helpers({
  // Generate all elements that is snake tail
  snakes(){
    return Game.find({snake: {"$ne": null}});
  },
  // Generate all elements that is ladder bottom
  ladders(){
    return Game.find({ladder: {"$ne": null}});
  }
});

Template.winner.helpers({
  // Check not winning condition
  noWinner() {
    return Players.findOne({score: 100}) == null;
  },
  // Render name of the winner
  winner() {
    return Players.findOne({score: 100}).name;
  }
});


