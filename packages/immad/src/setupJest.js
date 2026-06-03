import { enableFetchMocks } from 'jest-fetch-mock';
enableFetchMocks();

import 'jest-canvas-mock';

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
