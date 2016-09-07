import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

import { Players } from '../api/players.js';
import { Status, Game} from '../api/game.js';

import './body.html';

var snakes = [];
var ladders = [];



Template.login.events({
  'submit form'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    // Get player name
    var name = event.target.Name.value;
    var id = Players.find().count(); 
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
        position: 0, 
      });
      Status.insert({
        status: true,
        turn: 0,
      })
      for (n = 1; n <= 100; n++) {
        Game.insert({
          index: n,
          player: null,
          snake: null,
          ladder: null,
        })
      }
      for (n = 0; n < 3; n++){
        var head = Math.floor(Math.random() * 99) + 1;
        var tail = Math.floor(Math.random() * (100 - head)) + head;
        var headId = Game.findOne({index: head})._id;
        var tailId = Game.findOne({index: tail})._id;
        snakes.push([headId, tailId]);
        if (Game.findOne({index: tail}).snake == null) {
          Game.update({_id: tailId}, {$set: {snake: headId}})  
        }
      }
      for (n = 0; n < 3; n++){
        var bottom = Math.floor(Math.random() * 99) + 1;
        var top = Math.floor(Math.random() * (100 - bottom)) + bottom;
        var bottomId = Game.findOne({index: bottom})._id;
        var topId = Game.findOne({index: top})._id;
        ladders.push([topId, bottomId]);
        if (Game.findOne({index: bottom}).snake == null && Game.findOne({index: bottom}).ladder == null) {
          Game.update({_id: bottomId}, {$set: {ladder: topId}})
        }
      }

    } 
    event.target.Name.value = '';
  },
});

Template.board.helpers({
  boxes() {
    return Game.find({}, { sort: { index: 1 } });
  },
});

Template.play.onCreated(function playOnCreated() {
  this.number = new ReactiveVar(0);
});


Template.play.helpers({
  who() {
    cur = Status.findOne().turn;
    return Players.findOne({ index: cur }).name;
  },

  number() {
    return Template.instance().number.get();
  },
  
});

Template.box.helpers({
  display() {
    if (this.player != null) {
      return Players.find({_id: this.player});
    }
  },
  player() {
    if (this.player != null) {
      return "player" + Players.findOne({_id: this.player}).index;
    }
  }
});

Template.restart.events({
  'click button'(event) {
    for(n = 0; n < 4; n++){
      Players.remove({_id: Players.findOne()._id});
    }
    for(n = 0; n < 100; n++){
      Game.remove({_id: Game.findOne()._id});
    }
    Status.remove({_id: Status.findOne()._id});
  }
})

Template.play.events({
  'click button'(event, instance) {
    //roll die
    var die = Math.floor(Math.random() * 6) + 1;
    instance.number.set(die);
    //identify current player, id, old and new position id, as well as status id for updating purpose
    var currentIndex = Status.find().fetch()[0].turn;
    var nextIndex = (currentIndex + 1) % 4;
    var player = Players.find({index: Status.find().fetch()[0].turn}).fetch()[0];
    var playerPosition = Game.findOne({index: player.score});
    var playerNewPosition = Game.findOne({index: player.score + die});
    var status = Status.findOne();
    //update database

    if (player.score + die >= 100) {
      Players.update({_id: player._id}, {$set: {score: 100}});
      for(n = 0; n < 100; n++){
        Game.remove({_id: Game.findOne()._id});
      }
      Status.update({_id: status._id}, {$set: {status: false}});
    } else {
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
      if (player.score > 0) {
        Game.update({_id: playerPosition._id}, {$set: {player: null}});
      }
      Players.update({_id: player._id}, {$set: {score: playerNewPosition.index}});
      Game.update({_id: playerNewPosition._id}, {$set: {player: player._id}});
      Status.update({_id: status._id}, {$set: {turn: nextIndex}});
    }
  },
});

Template.result.helpers({
  //return all players
  players() {
    return Players.find(); //{ sort: { score: -1 } }
  }
});

Template.player.helpers({
  active() {
    return this.index == Status.findOne().turn;
  },
  player() {
    return "player" + this.index;
  }
});

Template.winner.helpers({
  noWinner() {
    return Players.findOne({score: 100}) == null;
  },

  winner() {
    return Players.findOne({score: 100}).name;
  }
});

Template.detail.helpers({
  snakes(){
    return Game.find({snake: {"$ne": null}});
  },

  ladders(){
    return Game.find({ladder: {"$ne": null}});
  }
});
