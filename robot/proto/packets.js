import Protobuf from 'protobufjs';
import path from 'path';

const builder = Protobuf.loadProtoFile(path.join(__dirname, 'tetris.proto'));
const tetris = builder.build('tetris');

export default tetris;
