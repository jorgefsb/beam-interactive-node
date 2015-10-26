Build a Robot in 10 Minutes
===========================

Prerequisites
-------------

We're going to be using the `Beam Interactive reference library <https://github.com/WatchBeam/beam-interactive-node>`_ to build a simple Robot in about ten minutes. Users will be able to visit your channel on Beam, and control the mouse movement on your screen. Let's get started!

You're going to need `Node.js <https://nodejs.org/en/download/>`_ installed locally, as well as required dependencies for `node-gyp <https://github.com/nodejs/node-gyp#installation>`_ in order to compile the desktop automation package. Basic familiarity with the command line and JavaScript is a help.

0. Setup Your Environment
-------------------------

Let's go ahead and make a new directory for our project. We'll then use npm (which came bundled with your Node.js installation) to install a desktop automation library, appropriately named `robotjs <https://github.com/octalmage/robotjs>`_.

::

    [connor@helios ~]# mkdir r2d2
    [connor@helios ~]# cd r2d2
    [connor@helios r2d2]#  npm install robotjs \
        git+ssh://git@github.com:WatchBeam/beam-client-node \
        git+ssh://git@github.com:WatchBeam/beam-interactive-node.git

    beam-client-node@0.0.1 node_modules/beam-client-node
    ├── error@5.2.0
    ├── bluebird@2.10.0
    ├── request@2.62.0
    ├── lodash@3.10.1
    └── ws@0.7.2

    robotjs@0.2.4 node_modules/robotjs
    └── nan@1.9.0

    beam-interactive-node@1.0.0 node_modules/beam-interactive-node
    ├── varint@4.0.0
    ├── protobufjs@4.0.0
    └── ws@0.8.0

Great! Now, hop over to the Beam developers site to register your game.

1. Registering Your Game
------------------------

todo after developers site is up...

2. Write up the Bot
-------------------

Let's make a file ``r2d2.js``. We'll start off by importing all the modules we'll need, as well as the stream ID and our username and password for Beam.

.. code-block:: js

    var Beam = require('beam-client-node');
    var Tetris = require('beam-interactive-node');
    var rjs = require('robotjs');

    var stream = 1234;
    var username = 'connor';
    var password = 'password';

Then, we want to authenticate with the main site. We can pull most of this code straight from the `example file <https://github.com/WatchBeam/beam-client-node/blob/master/example/joinChat.js>`_ included in the Node.js client.

.. code-block:: js
    :emphasize-lines: 6

    var beam = new Beam();
    beam.use('password', {
        username: username,
        password: password
    }).attempt().then(function () {
        return beam.game.join(stream);
    })

The most notable change is that, rather than trying to join a channel's chat, we're asking for an authentication key and game details for the stream. That method (the highlighted line) a promise that's resolved to the channel details we get from the Beam API. We're then ready to connect to Tetris!

.. code-block:: js


        return beam.game.join(stream);
    }).then(function (details) {
        var robot = new Tetris.Robot(details);
        robot.handshake();

        robot.on('report', function (report) {
            var mouse = robot.getMousePos();
            rjs.moveMouse(
                Math.round(mouse.x + 300 * report.joystick[0].mean),
                Math.round(mouse.y + 300 * report.joystick[1].mean)
            );
        });
    });

Let's break this down a bit.

.. code-block:: js

    var robot = new Tetris.Robot(details);
    robot.handshake();

First, we create a new Robot client and ask for it to handshake with the server. In production code, you'll want to add a callback as the first parameter of the handshake in case of error, but it's omitted here for simplicity.

.. code-block:: js

    robot.on('report', function (report) {
        var mouse = robot.getMousePos();
        rjs.moveMouse(
            Math.round(mouse.x + 300 * report.joystick[0].mean),
            Math.round(mouse.y + 300 * report.joystick[1].mean)
        );
    });

At the ReportInterval we specified back when we registered the client, Tetris will send us reports of what our viewers are doing. There's :ref:`more documentation <robot-to-tetris>` about what exactly the report contains, but for now all we need to know is that Tetris will send us how far users moved their mice (or, "joysticks") as a float value from -1 to 1. If users moved their mice hard to the upper left, the joystick axes will be close to ``(-1, -1)``. If they moved their mice to the lower right corner, they'll be close to ``(1, 1)``.

We take the viewers' average joystick position, and use robotjs to move the mouse relative to its current position on the screen. I've chosen to multiply the means by an arbitrary constant ``300``, so that there is a visible effect.

And that's it! Boot up ``node r2d2.js`` and head on to step 3 to start streaming.

The Final Code
^^^^^^^^^^^^^^

.. code-block:: js
    :linenos:

    var Beam = require('beam-client-node');
    var Tetris = require('beam-interactive-node');
    var rjs = require('robotjs');

    var stream = 1234;
    var username = 'connor';
    var password = 'password';

    var beam = new Beam();
    beam.use('password', {
        username: username,
        password: password
    }).attempt().then(function () {
        return beam.game.join(stream);
    }).then(function (details) {
        var robot = new Tetris.Robot(details);
        robot.handshake();

        robot.on('report', function (report) {
            var mouse = robot.getMousePos();
            rjs.moveMouse(
                Math.round(mouse.x + 300 * report.joystick[0].mean),
                Math.round(mouse.y + 300 * report.joystick[1].mean)
            );
        });
    });

3. Start Streaming
------------------

todo after main site is up...
