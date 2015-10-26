Games
=====

Schema
------

Being relatively static resources, games are stored in SQL. The schema which tetrisd requires is as follows:

.. code-block:: sql

    CREATE TABLE `tetris_games` (
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
      `controls` text NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

There may be other columns added, but these two are all that Tetris needs. The ``controls`` columns should be a JSON-encoded controls object, as described below.

The Controls Object
-------------------

.. _controls:

In Go, the controls struct could be represented as:

.. code-block:: go

    type Controls struct {
        ReportInterval uint
        Joystick []struct {
            Axis     uint32
            Analysis []uint
        }
        Tactile []struct {
            Key      uint32
            Up       bool
            Down     bool
            Analysis []uint

            Grid struct {
                URL    string
                Help   string
                Text   string
                X      float64
                Y      float64
                Width  float64
                Height float64
            }
        }
        Grid struct {
            Width  uint
            Height uint

            Joystick struct {
                Help   string
                X      float64
                Y      float64
                Width  float64
                Height float64
            }
        }
    }


The JSON object should be in much the same format, simply with StudlyCase converted to camelCase.

- ``reportInterval`` is the delay, in milliseconds, between reports being sent to the robot. This is the duration over which input will be gathered, before being aggregated, analyzed, and set to the robot.
- ``joystick`` is an array of objects with properties:

    - ``axis`` is an arbitrary numeric axis ID. Tetrisd doesn't care what the axis IDs are.
    - ``help`` is the help text to display for the joystick control.
    - ``analysis`` an :ref:`analysis list <analysis-list>` to run on the axis.

- ``tactile`` is an array of objects with properties:

    - ``key`` the :ref:`character code <codes>` for a button
    - ``up`` whether to record key releases. (Note: this will always be zero for scroll wheel buttons.)
    - ``down`` whether to record key presses.
    - ``analysis`` the :ref:`analysis list <analysis-list>` to run on this button.
    - ``grid`` defines information for displaying the button on the frontend.

        - ``url`` the URL links to an image to be displayed on the button on the frontend, for custom buttons only. This is optional.
        - ``text`` is a short string to display on the button itself.
        - ``help`` specifies longer help text to display for the button.
        - ``X`` defines its X coordinate on the grid. It's a floating point value, so alignment can be customized precisely. The origin is in the upper left-hand corner of the control space.
        - ``Y`` defines its Y coordinate on the grid. It's a floating point value, so alignment can be customized precisely. The origin is in the upper left-hand corner of the control space.
        - ``Width`` defines the number of grid spaces this element is wide.
        - ``Height`` defines the height of the element in grid spaces.


- ``grid`` defines the control space on the frontend:

    - ``width`` is the total number of columns in the grid.
    - ``height`` is the total number of rows in the grid.
    - ``joystick`` is the grid settings for the joystick control. See the "tactile" section above for details. This may be omitted if no joystick controls are requested.

Character Codes
^^^^^^^^^^^^^^^

Character codes are used for requesting input for Tetris games.These are standard JavaScript character codes, with the following special cases:

.. _codes:

- ``0``: left mouse button
- ``1``: right mouse button
- ``2``: center mouse button
- ``3``: scroll wheel up
- ``4``: scroll wheel down
- ``1024 ≤ code < 2048``: custom button

Analysis Lists
^^^^^^^^^^^^^^
.. _analysis-list:

Analysis lists are lists of unsigned integers which express what kinds of analysis will be done and reported on.

==== =============
 ID   Analysis
==== =============
0    Frequency
1    Mean
2    Standard Deviation
3    Quartiles
==== =============

Validation Checklist
^^^^^^^^^^^^^^^^^^^^

Here's a helpful list of things to check when allowing third parties to submit control objects. Only a control object which answers "yes" to all of the following may be considered valid:

- ☐ Are are there no extraneous yes?
- ☐ Are the data types for all keys and values correct?
- ☐ Is the report interval between 50 and 10000 milliseconds?
- ☐ Are help texts either omitted or of reasonable length?
- ☐ Do all "normal" buttons omit the URL property?
- ☐ For custom buttons, do they either include the URL or Text property?
- ☐ Are all Text properties of reasonable length and in a standard character set?
- ☐ Are all analysis requests within the range of IDs specified above?
- ☐ Are the number of custom buttons under a reasonable maximum?
- ☐ Are all joystick keys axes valid?
- ☐ Is there at a joystick or at least one tactile button requested?
- ☐ Do the x, y, width, and height of all controls not overlap or exceed the grid bounds?
- ☐ Are the width and height of all controls real numbers greater than or equal to 1?
- ☐ Do all tactile buttons request analysis on key ups, key downs, or both?
- ☐ Do all requested joystick and tactile inputs request at least one type of analysis?
