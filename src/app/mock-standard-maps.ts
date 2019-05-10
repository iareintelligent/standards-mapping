import { StandardMap } from './standard-map';
import * as mockMapDb from './data/msftgdprsample.json'

interface SampleModule {
    default: StandardMap
};

export var mapDb: StandardMap = (mockMapDb as any as SampleModule).default;


export var STANDARDMAPS: StandardMap[] = [];
