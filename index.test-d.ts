import {expectType} from 'tsd';
import stripJsonComments = require('.');

const options: stripJsonComments.Options = {};

const json = '{/*rainbows*/"unicorn":"cake"}';

expectType<string>(stripJsonComments(json));
expectType<string>(stripJsonComments(json, {whitespace: true}));
