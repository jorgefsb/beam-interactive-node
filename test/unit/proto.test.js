const Readable = require('stream').Readable;
const Stream = require('../../robot/proto/stream');
const Packets = require('../../robot/proto/packets');
const expect = require('chai').expect;
const varint = require('varint');

describe('proto', () => {
    describe('stream', () => {
        function reluctantReader (data) {
            const rs = new Readable();

            let pos = 0;
            rs._read = function () {
                const next = Math.min(data.length, pos + Math.ceil(Math.random() * 3));
                rs.push(data.slice(pos, next));
                pos = next;

                if (next === data.length) {
                    rs.push(null);
                }
            }

            return rs;
        }


        it('decodes correctly', (done) => {
            const num = 50;
            const bytes = [];
            for (let i = 0; i < num; i++) {
                const encoded = new Packets.Error({ message: 'asdf' + i }).toBuffer();
                bytes.push(new Buffer(varint.encode(encoded.length)));
                bytes.push(new Buffer(varint.encode(3)));
                bytes.push(encoded);
            }

            const decoder = new Stream.Decoder().on('error', console.error);
            let count = 0;
            decoder.on('message', (msg) => {
                expect(msg.message).to.equal('asdf' + (count++));
                if (count === num - 1) done();
            });

            reluctantReader(Buffer.concat(bytes)).pipe(decoder);
        });

        it('goes both ways ͡° ͜ʖ ͡°', (done) => {
            const decoder = new Stream.Decoder().on('error', console.error);
            const writer = new Stream.Encoder().on('error', console.error);
            const num = 50;

            writer.pipe(decoder);

            let count = 0;
            decoder.on('message', (msg) => {
                expect(msg.message).to.equal('asdf' + (count++));
                if (count === num - 1) done();
            });

            for (let i = 0; i < num; i++) {
                writer.push(new Packets.Error({ message: 'asdf' + i }));
            }
        });
    });
});
