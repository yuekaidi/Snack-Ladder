import { Mongo } from 'meteor/mongo';
// initialize players database
export const Players = new Mongo.Collection('players');
