import { Mongo } from 'meteor/mongo';
// initialize game database
export const Status = new Mongo.Collection('status');
export const Game = new Mongo.Collection('game');