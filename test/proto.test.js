const Readable = require('stream').Readable;
const Stream = require('../robot/proto/stream');
const Packets = require('../robot/proto/packets');
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


        it('reads correctly', (done) => {
            const num = 50;
            const bytes = [];
            for (let i = 0; i < num; i++) {
                const encoded = new Packets.Error({ message: 'asdf' + i }).toBuffer();
                bytes.push(new Buffer(varint.encode(encoded.length)));
                bytes.push(new Buffer(varint.encode(3)));
                bytes.push(encoded);
            }

            const reader = new Stream.Reader().on('error', console.error);
            let count = 0;
            reader.on('message', (msg) => {
                expect(msg.message).to.equal('asdf' + (count++));
                if (count === num - 1) done();
            });

            reluctantReader(Buffer.concat(bytes)).pipe(reader);
        });

        it('goes both ways ͡° ͜ʖ ͡°', (done) => {
            const reader = new Stream.Reader().on('error', console.error);
            const writer = new Stream.Writer().on('error', console.error);
            const num = 50;

            writer.pipe(reader);

            let count = 0;
            reader.on('message', (msg) => {
                expect(msg.message).to.equal('asdf' + (count++));
                if (count === num - 1) done();
            });

            for (let i = 0; i < num; i++) {
                writer.push(new Packets.Error({ message: 'asdf' + i }));
            }
        });
    });
});
