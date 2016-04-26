import Heartbeats from '../heartbeats';

export default class RobotHeartbeats extends Heartbeats {
    _ping() {
        this._socket.ping();
        this._socket.once('pong', () => this.touch());
    }
}
