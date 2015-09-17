import redis from 'redis';
import mysql from 'mysql';
import chai from 'chai';

chai.use(require('chai-subset'));

const cRedis = redis.createClient();
const cMysql = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'beam',
});

export function setGamerKey(id, key, game, callback) {
    cRedis.set('tetrisd:gamekey:' + id + ':' + key, game, callback);
}

export function setGame(id, controls, callback) {
    cMysql.query('delete from tetris_games where id = ?', id, function (err) {
        if (err) return callback(err);

        cMysql.query(
            'insert into tetris_games (id, controls) values (?, ?)',
            [id, JSON.stringify(controls)], callback
        );
    });
}
