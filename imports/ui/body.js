import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

import { Players } from '../api/players.js';

import './body.html';
import './player.js';

Template.login.events({
  'submit .login'(event) {
    // Prevent default browser form submit
    event.preventDefault();
 
    // Get value from form element
    target = event.target;
    text = target.text.value;
 
    // Insert a task into the collection
    Players.insert({
      text,
      score: 0,
      position: 0, // current time
    });
 
    // Clear form
    target.text.value = '';
  },
});

Template.login.helpers({
  name() {
    return Players.find();
  },
});

Template.play.onCreated(function playOnCreated() {
  // counter starts at 0
  this.number = new ReactiveVar(0);
});

Template.play.helpers({
  number() {
    return Template.instance().number.get();
  },
});

Template.play.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.number.set(Math.floor(Math.random() * 6) + 1  );
  },
});

Template.body.helpers({
  //return all players
  players() {
    return Players.find(); //{ sort: { score: -1 } }
  }
});

