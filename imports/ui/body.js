import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';

import { Players } from '../api/players.js';

import './body.html';

Template.player.events({
  'submit .new-player'(event) {
    // Prevent default browser form submit
    event.preventDefault();
 
    // Get value from form element
    const target = event.target;
    const text = target.text.value;
 
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

Template.player.helpers({
  players() {
    return Players.find({}, { sort: { createdAt: -1 } });
  },
});
