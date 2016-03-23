import Heartbeats from '../heartbeats';
import Packets from './packets';

export default class FrontendHeartbeats extends Heartbeats {
    _ping() {
        this._socket.send(new Packets.Ping({}).encode());
    }
}
