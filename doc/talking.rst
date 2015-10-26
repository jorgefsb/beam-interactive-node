***************************
Talking to Beam Interactive
***************************

Protocols
=========

.. _robot-to-tetris:

Robot to Beam Interactive
-------------------------

The basic protocol is made by sending a stream of `protocol buffers <https://developers.google.com/protocol-buffers/?hl=en>`_ over a TCP socket. Each packet is preceded by its length followed by the packet ID, as variable length integers. Variable integers are described in the `protocol buffer specification <https://developers.google.com/protocol-buffers/docs/encoding#varints>`_.

::

    ┌───────────────────────┐
    │Packet Length (varuint)│
    └───────────────────────┘
    ┌───────────────────────┐
    │  Packet ID (varuint)  │
    └───────────────────────┘
    ┌───────────────────────┐
    │      Packet Data      │
    │   (protocol buffer)   │
    .........................

The protocol is bi-directional. Tetrid expects information sent to it to be encoded in prescribed format, and it will in turn send information in the same format.

See the ``tetris.proto`` for packets and structure. The ID mapping is as follows:

==== =============
 ID   Packet
==== =============
0    Handshake
1    HandshakeACK
2    Report
3    Error
==== =============

Frontend to Beam Interactive
----------------------------

Beam Interactive communicates over plain websockets using JSON. The basic format of a packet is a four-byte event name followed by the JSON object. Not incredibly pretty to read but easy and efficient to deal with.

.. object:: Handshake Packet (hshk)

    The first packet sent from the client must be a handshake packet. Attributes should match those set in Redis, as described in the :ref:`authentication <player-authentication>` section above. Alternatively, one may send an empty ``hshk{}`` packet to log in anonymously. In this case they will receive ``prog`` updates but will not be permitted to send input and will not be counted in the quorum.

    .. code-block:: js

        hshk{
            id: 42,
            key: '68b329da9893e34099c7d8ad5cb9c940',
        }

    .. option:: id

        The ID of the user who is authenticating.

    .. option:: key

        Their authentication key.


.. object:: Handshake Acknowledgment (hack)

    In response to a valid Handshake Packet, the server sends back an empty Handshake Acknowledgment.

    .. code-block:: js

        hack{}

.. object:: Error (erro)

    An error packet may be sent back from Beam Interactive under the following (non-comprehensive) conditions:

    - An invalid handshake is given.
    - An unexpected or malformed packet is set.
    - A report with invalid data is sent.

    .. code-block:: js

        erro{
            message: "Invalid channel ID or key.",
        }

    .. option:: message

        An error message describing what went wrong.

.. object:: Report (data)

    Clients should report user input periodically as defined in the handshake. Events should be throttled and combined if frequent input (such as from a mouseMove in JavaScript) is given; there's no advantage to sending input more frequently than the reporting interval.

    If the user makes no input, you need not send a report.

    See :ref:`the controls section <controls>` for more information on the report structure; it matches up fairly well. For reference, the Go structure which the data is loaded into is defined as:

    .. code-block:: go

        type Report struct {
            Joystick []struct {
                Axis  uint32
                Value float64
            }
            Tactile []struct {
                Key  uint32
                Down uint
                Up   uint
            }
        }


    Example:

    .. code-block:: js

        data{
            joystick: [
                { axis: 0, value: 0.5 },
                { axis: 1, value: 0.75 },
            ],
            tactile: [
                // The user is dragging the LMB
                { key: 0, down: 1 },
                // The user "clicked" the key code 38 (up arrow) once, and
                // looks like is currently holding the key down.
                { key: 38, down: 2, up: 1 },
            ]
        }

.. object:: Progress Event (prog)

    A prog event may be sent up periodically at the behest of the Robot. It contains an array of objects for multiple controls on the frontend. For example:

    .. code-block:: js

        prog{
            updates: [{
                target: 0,
                code: 1
                progress: 0.1,
                cooldown: 10000,
                fired: false
            }]
        }

    .. option:: target

        The type of control this targets. ``0`` should be given for tactile controls, ``1`` for joystick controls.

    .. option:: code

        The code for the control target. For tactile controls, this will be the ``key`` code. For joystick controls, this will be the ``axis``.

    .. option:: progress*

        The progress this input as towards some threshold, designated by the robot. This must be a float value in the range [0, 1).

    .. option:: cooldown*

        The duration, in milliseconds, before the action effected by this input may be carried out again. Note that this will decrement automatically on the frontend and does not need continuous updates.

    .. option:: fired*

        Denotes that the action effected by this control has occurred, showing a "pulse" on the input.


    An asterisk denotes an optional property. Optional properties may not appear, or they may be sent to ``null``.




The Robot
=========

The robot interacts with Beam Interactive using a series of packets sent back and forth. Then general authentication flow is the following::

    ┌──────┐                      ┌──────┐
    │      │◀──────Handshake──────│      │
    │      │                      │      │
    │      │─────HandshakeACK────▶│      │
    │      │      (or error)      │      │
    │      │                      │      │
    │Server│◀───────Event─────────│Robot │
    │      │◀─────────────────────│      │
    │      │                      │      │
    │      │────────Report───────▶│      │
    │      │─────────────────────▶│      │
    │      │                      │      │
    └──────┘                      └──────┘


1. The Robot establishes a TCP connection to the server. It sends a Handshake packet, populated with the user ID and auth key.
2. Beam Interactive verifies the key. If it's correct, a blank HandshakeACK packet is sent. If it's not correct, an Error packet is sent down
