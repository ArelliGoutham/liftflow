// Polyfill Web API globals that jsdom doesn't provide.
// Next.js route handlers reference Request/Response/Headers.
const { TextDecoder, TextEncoder } = require('util');
if (typeof globalThis.TextDecoder === 'undefined') globalThis.TextDecoder = TextDecoder;
if (typeof globalThis.TextEncoder === 'undefined') globalThis.TextEncoder = TextEncoder;

const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
if (typeof globalThis.ReadableStream === 'undefined') globalThis.ReadableStream = ReadableStream;
if (typeof globalThis.WritableStream === 'undefined') globalThis.WritableStream = WritableStream;
if (typeof globalThis.TransformStream === 'undefined') globalThis.TransformStream = TransformStream;

const { MessagePort } = require('worker_threads');
if (typeof globalThis.MessagePort === 'undefined') globalThis.MessagePort = MessagePort;

const { Request, Response, Headers } = require('undici');
if (typeof globalThis.Request === 'undefined') globalThis.Request = Request;
if (typeof globalThis.Response === 'undefined') globalThis.Response = Response;
if (typeof globalThis.Headers === 'undefined') globalThis.Headers = Headers;
