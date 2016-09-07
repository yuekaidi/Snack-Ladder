import { Mongo } from 'meteor/mongo';

export const Status = new Mongo.Collection('status');
export const Game = new Mongo.Collection('game');