/* Retrospective archive commentary; original source is kept separately. */
const wireAnnotations = [
  {
    "start": 10,
    "title": "Identity and speed settings",
    "group": "Opening",
    "paragraphs": [
      "Thomas Newcomb confirms that he wrote all the code, including the BASIC application and the PrinterPort module. His brother Jonathan drove the user-interface design, designed and built the physical hot-wire machine, and designed its hardware protocol. The original header and shared title-screen credits are retained as written.",
      "Lines 100–110 set busy-loop delays, not velocities. A larger value means more waiting. Reset and cutting use different routines and therefore different scales, exactly as the original comments explain. REM text and original spellings are retained."
    ]
  },
  {
    "start": 130,
    "title": "Display and operating-system setup",
    "group": "Opening",
    "paragraphs": [
      "MODE 12 selects the Acorn display mode. Lines 190–230 redefine palette entries used for the interface: 10 is red for the selected node, 11 and 12 are greys, and 13 is yellow.",
      "An early ON ERROR handler treats error 17 (Escape) as leaving the application; the main loop later replaces this handler. The *FX calls adjust keyboard behaviour, and OS_RemoveCursors suppresses text cursors while the graphical interface is in use."
    ]
  },
  {
    "start": 250,
    "title": "State, calibration and storage",
    "group": "Opening",
    "paragraphs": [
      "BBC BASIC uses % for integer variables and $ for strings; unsuffixed variables here hold real values. nodes() stores coordinate pairs, nodes% counts active points, and editpoint% selects a point. Node zero is the fixed origin.",
      "Lines 420–440 mark the cutter as not yet homed (stx = -2) and set 32.072727777 steps per millimetre. spmm at line 480 is the empirical seconds-per-millimetre factor used by FN timings.",
      "DIM uses inclusive upper bounds: nodes(maxnodes%,1) has two coordinate columns and undo(undosize%,4) has five numeric columns. The editing guard limits active points to maxnodes%. The string array discs$ pairs display names with Acorn filing-system paths. These paths and audio buffers are dependencies of the original application, not browser resources."
    ]
  },
  {
    "start": 560,
    "title": "The top-level startup sequence",
    "group": "Opening",
    "paragraphs": [
      "The executable body calls startup, loads saved settings, draws menus, clears history, loads recordings, assembles ARM code, waits on the title page, draws the graph and enters PROC mainloop.",
      "END at line 650 separates this executable sequence from the procedure definitions. DEF PROC and DEF FN define named subroutines and functions that are invoked elsewhere; they are not a sequence of screens run in file order."
    ]
  },
  {
    "start": 670,
    "title": "PROC drawgraph · labelled axes",
    "group": "Display & input",
    "paragraphs": [
      "The graph maps a 600 × 250 model area onto Acorn graphics coordinates. xgraph and ygraph are viewport offsets; zoom% magnifies the model. Lines 730 and 830 increase tick spacing until labels will fit.",
      "VDU 5 prints text at graphics positions for axis labels; VDU 4 returns to the text cursor. The fractional offset calculations align ticks with the world grid even after panning. PROC drawgrid finishes the redraw."
    ]
  },
  {
    "start": 970,
    "title": "PROC drawgrid · redraw the plotting area",
    "group": "Display & input",
    "paragraphs": [
      "The routine fills the upper plotting area using colour 4, conditionally invokes the assembled grid renderer, and draws the path over it. Grid visibility and snapping are independent flags: hiding the grid does not disable snapping."
    ]
  },
  {
    "start": 1030,
    "title": "PROC drawmenus · a custom interface",
    "group": "Display & input",
    "paragraphs": [
      "PRINT TAB places text in fixed screen cells; RECTANGLE draws panel borders. This is an application-drawn interface, rather than a set of desktop window widgets.",
      "The four main columns expose editing, options, cutting and files. The lower panel adds contextual help, pointer coordinates, motor-disable controls and manual temperature. The visible spelling “Speach” is part of the original.",
      "Thomas Newcomb identifies Jonathan Newcomb, his brother, as the driving force behind the user-interface design. Thomas wrote the code implementing that interface."
    ]
  },
  {
    "start": 1260,
    "title": "PROC help · contextual messages",
    "group": "Display & input",
    "paragraphs": [
      "An empty argument requests the default help text. OH$ caches the last message so unchanged help does not repeatedly clear and redraw the panel.",
      "PROC texton selects the lower text window; OS_PrettyPrint wraps the message. PROC windowoff restores the normal windows afterwards. OH$ is also used elsewhere as a marker for modes such as the catalogue."
    ]
  },
  {
    "start": 1360,
    "title": "PROC scrollgraph · drag to pan",
    "group": "Display & input",
    "paragraphs": [
      "The initial mouse position and viewport are captured before the drag. Pointer displacement is converted back through the zoom factor, then clamped so the visible region stays within the model area.",
      "The pointer rectangle is temporarily widened during the drag. A dense grid is hidden while panning to reduce redraw work; its previous visibility is restored afterwards."
    ]
  },
  {
    "start": 1610,
    "title": "PROC mainloop · keyboard dispatch",
    "group": "Display & input",
    "paragraphs": [
      "The main loop installs PROC error and polls INKEY$(0), then dispatches keyboard commands with CASE. Undo, redo, grid, snap, catalogue, transformation, setup saving and typed coordinates all lead to named routines.",
      "The supplied text contains space-looking strings at lines 1660–1680. The help screen describes arrow keys for point navigation, but this text alone does not establish their intended character encodings. The archive preserves the supplied characters instead of silently replacing them."
    ]
  },
  {
    "start": 1810,
    "title": "Mouse input over the graph",
    "group": "Display & input",
    "paragraphs": [
      "Acorn MOUSE supplies coordinates and a button bit mask. In this dispatch, 4 selects add-point, 2 selects move-point and 1 selects pan. With no button pressed, a temporary ghost path previews a possible insertion.",
      "The y ≥ 512 and x ≥ 64 tests distinguish the plotting area from the menus. Shift, detected with INKEY -1, shows local help. The later PROC coords call is a display readout, not a change to the shape."
    ]
  },
  {
    "start": 1930,
    "title": "Menu hit testing and manual controls",
    "group": "Display & input",
    "paragraphs": [
      "Pointer coordinates are converted to text cells using DIV 16 and DIV 32. Bounds checks recognise the drawn arrows and invoke zoom, grid and temperature changes with a direction of +1 or -1.",
      "The same dispatch routes clicks to catalogue selection, motor-disable controls and the manual movement panel. This is explicit hit testing against the custom screen layout."
    ]
  },
  {
    "start": 2110,
    "title": "Edit, option and cut menu actions",
    "group": "Display & input",
    "paragraphs": [
      "The cell coordinates are reduced to a menu-column and row index. Each menu item has a Shift-help branch and an action branch.",
      "After one-shot actions, many branches wait until the mouse button is released. This prevents a single held click from repeatedly toggling a flag or deleting multiple points. Reset-to-origin invokes hardware homing rather than merely changing the drawing."
    ]
  },
  {
    "start": 2510,
    "title": "File-menu dispatch and the endless loop",
    "group": "Display & input",
    "paragraphs": [
      "The final column selects the current filing system, load, save, erase or catalogue. The y = -1 row is the column heading, which doubles as the disc selector.",
      "UNTIL FALSE keeps the application running. Escape is handled through the installed error handler rather than a normal loop termination condition."
    ]
  },
  {
    "start": 2750,
    "title": "PROC wait · frame-based delay",
    "group": "Controls & formatting",
    "paragraphs": [
      "The procedure executes WAIT X% times. This is the delay used for interface repetition and temporary previews; it is separate from the busy loops that regulate motor output."
    ]
  },
  {
    "start": 2800,
    "title": "PROC changezoom · bounded magnification",
    "group": "Controls & formatting",
    "paragraphs": [
      "The mouse-button mask chooses increments of 1, 5 or 10. The zoom is clamped to 1–25 and further adjusted to maintain a minimum visible grid spacing.",
      "Viewport offsets are brought back within the newly visible range. After updating the menu value and waiting briefly, the routine redraws the graph."
    ]
  },
  {
    "start": 2980,
    "title": "PROC changegrid · model-space spacing",
    "group": "Controls & formatting",
    "paragraphs": [
      "The grid interval changes by 1, 5 or 10 depending on the button, and is limited to 1–250. A second check prevents the grid from becoming too dense at the current zoom.",
      "The interval is expressed in the model’s millimetres. It affects both the drawn grid and PROC nearest, so changing it also changes subsequent snapping."
    ]
  },
  {
    "start": 3140,
    "title": "PROC changecuttemp · cutting setting",
    "group": "Controls & formatting",
    "paragraphs": [
      "The buttons select increments of 1, 10 or 50, with the result constrained to 0–254. This updates cuttemp% and its displayed value, but does not immediately call the hardware output routine.",
      "The setting is sent when PROC cut starts its cutting cycle. The code does not establish a conversion from this numeric setting to degrees Celsius."
    ]
  },
  {
    "start": 3280,
    "title": "PROC changenormtemp · idle setting",
    "group": "Controls & formatting",
    "paragraphs": [
      "This uses the same increments and limits as the cutting setting but changes normtemp%. Unlike PROC changecuttemp, it calls PROC out32 immediately, updating the normal output state."
    ]
  },
  {
    "start": 3430,
    "title": "FN align · left padding",
    "group": "Controls & formatting",
    "paragraphs": [
      "The function prepends enough copies of X$ to make N$ reach width X%. BBC BASIC string functions can be adjacent to variable names without spaces: LEN N$ reads the length of N$. The final equals sign returns the expression from the function."
    ]
  },
  {
    "start": 3460,
    "title": "FN fillup · right padding",
    "group": "Controls & formatting",
    "paragraphs": [
      "This is the companion to FN align: it appends the padding after N$. It is used to overwrite fixed-width fields, including file names and the disc label, so remnants of longer previous text do not remain visible."
    ]
  },
  {
    "start": 3490,
    "title": "FN onoroff · Boolean display",
    "group": "Controls & formatting",
    "paragraphs": [
      "BBC BASIC treats zero as false and nonzero as true. The function turns that value into a three-character ON or OFF field; the trailing space in “ON ” keeps the field width consistent."
    ]
  },
  {
    "start": 3520,
    "title": "PROC addnode · pointer to model coordinates",
    "group": "Shape editing",
    "paragraphs": [
      "The pointer is translated out of the screen origin, divided by the display scale and zoom, then offset into model space. PROC nearest optionally snaps the result.",
      "The new point is inserted after editpoint%, followed by an Add entry in the undo history. Shape mutation and history recording are separate calls."
    ]
  },
  {
    "start": 3600,
    "title": "PROC doaddnode · insertion into an array",
    "group": "Shape editing",
    "paragraphs": [
      "If the active count has reached maxnodes%, the routine reports “Out of memory”. Otherwise points above the insertion position are shifted backwards from the end, preventing a copy from overwriting the next source point.",
      "The new pair is stored at pos% + 1. undo% suppresses normal selection, redraw and button-release handling when this low-level routine is being used to replay history."
    ]
  },
  {
    "start": 3790,
    "title": "PROC windowon · graphics clipping",
    "group": "Shape editing",
    "paragraphs": [
      "VDU 24 restricts the graphics window to the plotting area. The semicolon notation supplies the coordinates in the form expected by the Acorn VDU interface, keeping path drawing out of the menus."
    ]
  },
  {
    "start": 3830,
    "title": "PROC windowoff · restore windows",
    "group": "Shape editing",
    "paragraphs": [
      "VDU 26 restores the default text and graphics windows. It is used after both clipped plotting and temporary text-window operations."
    ]
  },
  {
    "start": 3870,
    "title": "PROC drawpath · nodes and segments",
    "group": "Shape editing",
    "paragraphs": [
      "Every active point is converted from model coordinates through the viewport and zoom to screen coordinates. Nodes are filled circles: colour 10 marks the current editing point and colour 11 marks the others.",
      "The outgoing segment from the editing point is drawn in white. That segment indicates where a new point will be inserted; other segments retain the grey drawing colour."
    ]
  },
  {
    "start": 4030,
    "title": "PROC drawghost · reversible insertion preview",
    "group": "Shape editing",
    "paragraphs": [
      "The prospective point is calculated and optionally snapped, then connected to the editing point and, when present, the following point.",
      "GCOL 3 uses an exclusive-OR drawing action. Drawing identical lines a second time removes the preview without needing to save and restore the underlying image. The short wait makes the preview visible before it is erased."
    ]
  },
  {
    "start": 4190,
    "title": "PROC moveedit · select a different node",
    "group": "Shape editing",
    "paragraphs": [
      "The argument moves the editing index forwards or backwards. Holding Control multiplies the change by maxnodes%; clamping then takes it directly to the beginning or end.",
      "The graph and help readout are refreshed. Selection does not alter the stored coordinates or create an undo record."
    ]
  },
  {
    "start": 4270,
    "title": "PROC deletepoint · record and delete",
    "group": "Shape editing",
    "paragraphs": [
      "The wrapper records the selected point’s position and coordinates as a Delete history entry, calls the low-level removal routine, then displays the current selection.",
      "The undo record is created before the lower routine checks the fixed-origin restriction. The ordering is preserved here rather than rewritten as a modernised implementation."
    ]
  },
  {
    "start": 4320,
    "title": "PROC dodeletepoint · preserve the origin",
    "group": "Shape editing",
    "paragraphs": [
      "Position zero cannot be deleted: it represents the fixed (0,0) start. Other deletions shift all following coordinates down one slot and reduce the active count.",
      "For ordinary editing the selection moves back and the grid redraws. History replay supplies undo% = TRUE and manages selection and redraw itself."
    ]
  },
  {
    "start": 4460,
    "title": "PROC moveapoint · drag, preview and commit",
    "group": "Shape editing",
    "paragraphs": [
      "The origin is immovable. For any other selected node, the routine tracks the mouse while a button is down and calculates a snapped or free model coordinate.",
      "XOR lines connect the candidate location to its neighbours, providing a reversible drag preview. On release inside the plotting area, the routine records old and new coordinates in a Move entry, commits the position and redraws."
    ]
  },
  {
    "start": 4760,
    "title": "PROC domoveapoint · history replay helper",
    "group": "Shape editing",
    "paragraphs": [
      "This helper directly assigns a coordinate pair at pos%. Its x% and y% parameters are integers, while nodes() holds real values. Calls through this helper therefore pass through integer parameters; the original drag and transform code can assign real coordinates directly."
    ]
  },
  {
    "start": 4800,
    "title": "PROC coords · live coordinate readout",
    "group": "Shape editing",
    "paragraphs": [
      "The same inverse screen mapping used during insertion produces nx and ny, with optional grid snapping. The integer and fractional parts are printed in separate fixed-width fields in the lower bar.",
      "nx and ny are local here: moving the pointer changes this readout without changing any stored point."
    ]
  },
  {
    "start": 4910,
    "title": "PROC deleteshape · clear with confirmation",
    "group": "Shape editing",
    "paragraphs": [
      "After clearing pending keyboard input, the routine asks for Y/N confirmation. A yes resets the active count to one, selects the origin, redraws and clears all undo records.",
      "This operation resets the shape as a whole; it is not recorded as a reversible series of point deletions."
    ]
  },
  {
    "start": 5000,
    "title": "PROC cat · paged directory catalogue",
    "group": "Files & recovery",
    "paragraphs": [
      "OS_GBPB reason 9 reads directory names into buf%, using catologueno% as the continuation position. FN null converts each zero-terminated name from memory into a BASIC string.",
      "The catalogue is arranged as four columns. When 17 entries are reported, two are left for the next page and the last display cell becomes a “more >>>” link. cat$ stores the names behind the clickable text."
    ]
  },
  {
    "start": 5240,
    "title": "PROC texton · the lower text window",
    "group": "Files & recovery",
    "paragraphs": [
      "The routine clears the catalogue-selection marker sx% and uses VDU 28 to define the lower help/input text window. The final VDU 30 homes the text cursor inside that window."
    ]
  },
  {
    "start": 5290,
    "title": "FN null · a string at a memory address",
    "group": "Files & recovery",
    "paragraphs": [
      "The numeric SWI &2C is OS_GSTrans. It is used here to obtain a BASIC string from a zero-terminated name at address X%. OS_GSTrans also has translation semantics, so it is more specific than a general memory-copy function."
    ]
  },
  {
    "start": 5340,
    "title": "PROC catselect · click a catalogue entry",
    "group": "Files & recovery",
    "paragraphs": [
      "Text-cell coordinates identify a row and column in cat$. The special “>” entry advances the catalogue using the saved continuation position.",
      "For a real name, the previous selection is unhighlighted and the new one is highlighted and stored in selectedcat$. The file is not opened until a load, save or erase action requests it."
    ]
  },
  {
    "start": 5520,
    "title": "PROC bufferselected · prefill via the keyboard",
    "group": "Files & recovery",
    "paragraphs": [
      "OS_Byte reason 138 inserts each character of selectedcat$ into the keyboard input buffer. The later INPUT statement consumes those characters as if typed, offering an editable default file name without a separate text-field widget."
    ]
  },
  {
    "start": 5600,
    "title": "PROC load · validate and read a shape",
    "group": "Files & recovery",
    "paragraphs": [
      "The selected name is prefilled, FN convertfilename resolves the path, and OPENIN opens it. The first string must be WIRE; otherwise the file is closed and an error raised.",
      "Coordinate pairs are then read until end-of-file, replacing the current shape. History is cleared, the last point becomes selected and the graph redraws. The supplied loop has no explicit maxnodes% guard and does not validate every loaded coordinate; those are properties of this listing, not added archive checks."
    ]
  },
  {
    "start": 5900,
    "title": "PROC save · the WIRE file format",
    "group": "Files & recovery",
    "paragraphs": [
      "OPENOUT creates or replaces the chosen file. BPUT writes the WIRE identifying string, then PRINT# writes each active coordinate pair in BASIC’s file representation.",
      "The routine closes the handle, restores cursor and window state, and remembers the name for the next operation. The data file is a shape description, distinct from the application’s !RunImage source file."
    ]
  },
  {
    "start": 6140,
    "title": "PROC erase · filing-system deletion",
    "group": "Files & recovery",
    "paragraphs": [
      "The prompt accepts an editable file name and resolves it through FN convertfilename. A nonempty response is passed to OSCLI as a Delete command.",
      "This routine does not provide an additional Y/N confirmation. It finishes by restoring the display and retaining the selected name. The archive displays this historical code without executing filing-system commands."
    ]
  },
  {
    "start": 6300,
    "title": "PROC error · Escape and recovery",
    "group": "Files & recovery",
    "paragraphs": [
      "The handler restores Escape handling, the mouse, cursors, text state and normal hardware output before presenting a message. ERR = 17 distinguishes Escape from other errors.",
      "quit% acts as an operation-state marker: 0 prompts to quit the program, 1 handles an interrupted quit prompt, and 2 returns from a modal operation. RG% requests a full graph redraw after Escape recovery.",
      "Other errors display REPORT$ and ERL, wait for fresh input, then restore the help window. This is recovery around the original operating environment, not evidence that the full program has been executed or validated in this browser."
    ]
  },
  {
    "start": 6770,
    "title": "PROC RC · restore cursors",
    "group": "Files & recovery",
    "paragraphs": [
      "OS_RestoreCursors is called five times. The repetition is present in the source; the file does not explain why five calls were chosen. The routine is used before console-style input and while recovering from errors."
    ]
  },
  {
    "start": 6840,
    "title": "PROC checkcut · estimate and confirm",
    "group": "Cutting & hardware",
    "paragraphs": [
      "A shape consisting only of the origin is rejected. Otherwise FN timings estimates the cutting duration and a modal Y/N prompt precedes any call to PROC cut.",
      "The prompt explicitly excludes reset time. Mouse and keyboard buffers are cleared around the confirmation so a held or stale input is not reused as a fresh answer."
    ]
  },
  {
    "start": 7040,
    "title": "PROC cut · follow the stored path",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The cutter is homed, the Insert prompt is played or displayed, and a key press precedes the cutting-temperature output. The loop starts at node 1 because node zero is the origin.",
      "Each target is rounded from millimetres to motor steps with INT(value × stpmm + .5). PROC movewire receives a relative difference from stx and sty, not an absolute position.",
      "After all segments, PROC out32 restores the normal setting and the Wire message warns about residual heat. The original recordings are now available in the Audio & data tab."
    ]
  },
  {
    "start": 7210,
    "title": "FN temp · zero means OFF",
    "group": "Cutting & hardware",
    "paragraphs": [
      "A nonzero setting is formatted in a three-character field; zero is displayed as OFF. This is a display convention, not a measured temperature reading."
    ]
  },
  {
    "start": 7240,
    "title": "PROC out32 · restore the normal control word",
    "group": "Cutting & hardware",
    "paragraphs": [
      "FN temptosend encodes normtemp%, and disabled% contributes the motor-disable mask. The combined 32-bit word is sent through PP_ShiftOut32. The PP interface is supplied by the companion PrinterPort module. Its ModuleAss source is now preserved in the Module source tab; PPSHIFTOUT32 implements this call."
    ]
  },
  {
    "start": 7280,
    "title": "FN temptosend · pack a control word",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The numeric setting is placed in bits 8 onwards. A three-character, colon-padded representation supplies digit codes shifted into higher nibbles; subtracting &30 maps ASCII digits to numeric values and the colon to 10.",
      "BBC BASIC TRUE is -1. Consequently the final subtraction involving (X%=0) adds bit 7 when the setting is zero. The packed layout shows what this program sends, but the external circuit schematic is not supplied."
    ]
  },
  {
    "start": 7330,
    "title": "PROC disablemenu · four motor flags",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The clicked label selects a bit in disabled%. EOR toggles that bit; bit tests generate ax, ay, bx or by and choose a red background for a disabled motor.",
      "The updated mask is sent immediately through PROC out32. The source exposes four motor labels while its path model and movement routine use a shared X/Y displacement."
    ]
  },
  {
    "start": 7490,
    "title": "PROC manualmenu · jog the cutter",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The clicked arrow region maps to dx% and dy% in -1, 0 or 1. If either motor in an axis pair is disabled, movement on that axis is zeroed and an explanatory message is displayed.",
      "The left button moves one step and waits for release; the middle button repeats through the main loop while held; the right button requests 12 times the displacement. All three paths use PROC movewire and its homing and boundary checks."
    ]
  },
  {
    "start": 7650,
    "title": "PROC movewire · signs, direction and homing",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The original REM says the input is relative and measured in steps. stx = -2 means the mechanism has not been homed, so movement is refused.",
      "SGN captures the requested signs before ABS makes the distances positive. The direction bits d% are assembled separately from the pulse bits. A zero-length move skips both stepping branches."
    ]
  },
  {
    "start": 7730,
    "title": "X-major movement · distribute Y steps",
    "group": "Cutting & hardware",
    "paragraphs": [
      "When X is longer, every iteration advances X once. The slope g = y%/x% tells the routine when the rounded minor-axis position changes.",
      "At line 7760 the comparison yields -1 for true in BBC BASIC; the leading minus converts it to c% = 1. Y advances only on those iterations. The added integer y% is a constant offset in both rounded expressions and does not change their difference.",
      "The next position is checked against 600 × 250 mm converted to steps. PP_ShiftOut8 sends a pulse word followed by the direction-only word. Position is updated after output; Escape handling is temporarily disabled around that critical sequence, then restored for the inter-step delay."
    ]
  },
  {
    "start": 7870,
    "title": "Y-major movement · the symmetric branch",
    "group": "Cutting & hardware",
    "paragraphs": [
      "This branch includes equal displacements. Every iteration advances Y, and g = x%/y% determines when X also advances. The same rounding test, limits, output pair and position bookkeeping apply with the axes exchanged.",
      "This is a floating-point slope-and-rounding line-step algorithm. It serves the same broad purpose as a raster line algorithm, but the listing is not an integer-error Bresenham implementation. The interactive exhibit adapts these coordinate decisions without reproducing hardware output or timing."
    ]
  },
  {
    "start": 8050,
    "title": "PROC enescandslowit · delay and Escape",
    "group": "Cutting & hardware",
    "paragraphs": [
      "*FX 229 0 re-enables normal Escape handling after a pulse. A busy loop from zero through cuttingspeed% controls the wait; INKEY(0) also checks for character 27 and *FX 125 raises Escape.",
      "The speed setting therefore depends on execution speed and loop overhead, rather than being an elapsed-time or feedback-controlled feed rate."
    ]
  },
  {
    "start": 8130,
    "title": "PROC disesc · protect the pulse sequence",
    "group": "Cutting & hardware",
    "paragraphs": [
      "*FX 229 1 disables normal Escape recognition. PROC movewire calls this immediately before hardware output and position bookkeeping, then calls PROC enescandslowit to re-enable it. This brackets a small critical section."
    ]
  },
  {
    "start": 8170,
    "title": "PROC reset0 · two-phase homing",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The operator is prompted to clear obstructions before the reset. PP_ShiftIn8 reads feedback bits; the first loop inverts and remaps the high nibble to select which pulse outputs remain active.",
      "The second loop reads the opposite feedback condition, combines the mapped bits with 170, and uses extra delay calls. It appears to back away from the home switches after approaching them; the exact physical wiring is not documented in this source.",
      "Only after both loops finish are stx and sty set to zero. This is physical homing based on input feedback, distinct from merely setting the software origin.",
      "ModuleAss shows that PP_ShiftIn8 receives the feedback serially through the A3000 printer Acknowledge input (IOC control bit 6). It toggles printer-data outputs D6 and D7 to manage the transfer. The A3000 service manual identifies that input; the assignment of the returned bits to the machine switches depends on Jonathan’s hardware protocol."
    ]
  },
  {
    "start": 8460,
    "title": "PROC resslow · reset delay",
    "group": "Cutting & hardware",
    "paragraphs": [
      "The empty FOR loop runs from zero through resetspeed%. It intentionally consumes processor time between homing pulses. Its timing scale differs from the cutting loop, as the opening comments warn."
    ]
  },
  {
    "start": 8510,
    "title": "PROC startup · initial title and outputs",
    "group": "Startup & ARM code",
    "paragraphs": [
      "The routine hides the pointer, sends the fixed initial 32-bit control word and draws the title screen. It then shows a loading message, repositions the pointer and restores contextual help and the normal output state.",
      "The meaning of every bit in &0AA00080 cannot be established without the external hardware documentation; the archive retains the literal value rather than assigning unsupported circuit labels."
    ]
  },
  {
    "start": 8630,
    "title": "PROC endup · wait, then fall through",
    "group": "Startup & ARM code",
    "paragraphs": [
      "This displays the finished-loading prompt and waits for either a click or key, then for mouse-button release.",
      "There is no ENDPROC before DEF PROC nicedisplay at line 8700. In BBC BASIC, executing through a DEF PROC line continues into its body; this deliberate-looking fall-through redraws the title and returns at the later ENDPROC. The listing is preserved with that control flow."
    ]
  },
  {
    "start": 8700,
    "title": "PROC nicedisplay · credits and typography",
    "group": "Startup & ARM code",
    "paragraphs": [
      "The title page prints Wire Cutter and the full line “by Jonathan Newcomb and Thomas Newcomb for”, then renders Liverpool College as enlarged graphics text.",
      "Thomas Newcomb clarifies the roles behind this shared title-screen credit: he wrote all the code; his brother Jonathan drove the interface design and designed and built the polystyrene-cutting machine and its hardware protocol. The historical title text is preserved unchanged."
    ]
  },
  {
    "start": 8880,
    "title": "PROC assemble · BASIC hosts ARM assembly",
    "group": "Startup & ARM code",
    "paragraphs": [
      "A 400-byte machine-code area is reserved, and P% points at its start. The bracketed assembler runs with OPT values 8 and 10, providing two passes so forward label references can be resolved.",
      "Lines 8950–8980 are original assembler comments explaining fixed-point inputs. They use semicolons inside the assembler, unlike REM comments in BASIC; they remain part of the untouched listing."
    ]
  },
  {
    "start": 8990,
    "title": "drawgrid · fixed-point ARM renderer",
    "group": "Startup & ARM code",
    "paragraphs": [
      "The routine saves its return address, selects graphics colour through VDU SWIs and walks a nested X/Y grid. R3 and R4 supply initial offsets, R5 the screen scale and R6 the grid step, all scaled by 256.",
      "Multiplying two values with eight fractional bits gives sixteen fractional bits; LSR #16 converts each product back to an integer screen coordinate. Offsets 64 and 514 place the points in the plotting area, and OS_Plot with code 69 plots the grid dots.",
      "R8 advances across X and R9 across Y until the 600 × 250 bounds are passed. The PC-return forms with ^ belong to the historical ARM execution model and should not be read as portable modern ARM code."
    ]
  },
  {
    "start": 9270,
    "title": "playsample · serial output in assembly",
    "group": "Startup & ARM code",
    "paragraphs": [
      "The sample pointer arrives in R1 and its end pointer in R2 through the BASIC CALL convention. XOS_EnterOS enters the operating-system context used by the direct I/O routine.",
      "Each byte is read, its highest bit is tested, and eight iterations shift its bits through writes at writeadd. Further output writes mark the end of the byte. Repeated LDR instructions appear to provide timing delays; their precise timing depends on the original machine.",
      "The A3000 service manual identifies WRITEADD (&3350010) as the printer-data latch. This routine sends its sample bits through printer-data outputs, as does the companion PrinterPort module. It is not using the A3000 VIDC sound interface. The external audio circuitry and recording format specification have not been supplied.",
      "The supplied recording files are consistent with unsigned 8-bit linear PCM, one byte per sample. The loop contains no timer-based sample clock; its repeated loads and I/O writes determine playback speed. The Audio & data tab offers a 15,000 Hz preview, explicitly unconfirmed, and an adjustable rate."
    ]
  },
  {
    "start": 9600,
    "title": "writeadd · embedded hardware address",
    "group": "Startup & ARM code",
    "paragraphs": [
      "EQUD stores the word &3350010 at the writeadd label for the playback routine to load. The closing bracket and NEXT finish the assembler pass loop, and ENDPROC returns to BASIC.",
      "The A3000 service manual (page 7) identifies &3350010 as the printer-data latch. ModuleAss also accesses Latch B at &3350018 for printer strobe, and IOC control at &3380000 for the Acknowledge input. The Module source tab includes the address map and links to the manual."
    ]
  },
  {
    "start": 9650,
    "title": "PROC calldrawgrid · bridge to machine code",
    "group": "Startup & ARM code",
    "paragraphs": [
      "D%, E%, F% and G% prepare the values passed in ARM registers R3–R6 by the BASIC CALL convention. Each expression is multiplied by 256 to create the eight-fractional-bit representation expected by drawgrid.",
      "This wrapper keeps viewport calculations in BASIC while the repetitive plotting loop runs in assembled code."
    ]
  },
  {
    "start": 9720,
    "title": "PROC enterundo · a circular operation log",
    "group": "History & utilities",
    "paragraphs": [
      "Each entry stores an operation name, point index, old coordinates and new coordinates. The cursor advances modulo undosize% + 1 because the arrays have inclusive upper bounds.",
      "Clearing the next operation-name slot marks the new end of the history. A fresh edit after an undo therefore cuts off the redo continuation."
    ]
  },
  {
    "start": 9830,
    "title": "PROC undo · apply inverse operations",
    "group": "History & utilities",
    "paragraphs": [
      "The cursor moves one slot backwards around the circular log. Add is reversed by deletion, Delete by insertion and Move by restoring the old coordinates.",
      "Transformations are bracketed by MegaMoveEdge markers. Undo walks the intermediate MegaMove entries backwards as one group. Selection is clamped and the display refreshed afterwards; an empty history slot produces a beep."
    ]
  },
  {
    "start": 10040,
    "title": "PROC redo · replay forward operations",
    "group": "History & utilities",
    "paragraphs": [
      "Redo reapplies the entry at the history cursor, using the saved new coordinates for Move. MegaMoveEdge brackets make a whole transformation advance as one operation.",
      "The supplied text has two ENDCASE statements at lines 10180–10190 for the one CASE opened at 10060. This appears to be a listing defect and would need verification on the original runtime; the archive neither removes it nor claims the program has passed an execution test."
    ]
  },
  {
    "start": 10270,
    "title": "PROC clearundobuffer · reset history",
    "group": "History & utilities",
    "paragraphs": [
      "The history cursor is set to zero and both arrays are cleared in bulk. A new load or deletion of the whole shape starts with an empty operation history."
    ]
  },
  {
    "start": 10330,
    "title": "FN timings · estimate by the longer axis",
    "group": "History & utilities",
    "paragraphs": [
      "For each segment, the routine takes the larger absolute coordinate difference. This matches the major-axis loop count used by PROC movewire more closely than Euclidean segment length would.",
      "The total is multiplied by spmm and converted to rounded minutes. x%, y% and t% are integers, so this estimate discards fractional millimetres and excludes homing and operator pauses."
    ]
  },
  {
    "start": 10420,
    "title": "PROC togglegrid · visibility only",
    "group": "History & utilities",
    "paragraphs": [
      "NOT flips the visibility flag, the menu text is refreshed, and the plotting area redraws. snap% is untouched, allowing an invisible snapping grid."
    ]
  },
  {
    "start": 10460,
    "title": "PROC togglesnap · coordinate quantisation",
    "group": "History & utilities",
    "paragraphs": [
      "This flips snap% and updates the ON/OFF text. Existing nodes are not moved; the flag affects later pointer-coordinate calculations that call PROC nearest."
    ]
  },
  {
    "start": 10500,
    "title": "PROC togglespeach · spoken prompts",
    "group": "History & utilities",
    "paragraphs": [
      "The original variable and procedure retain the spelling speach. Toggling the flag changes whether PROC playsample sends recorded speech; its text prompts still appear either way."
    ]
  },
  {
    "start": 10540,
    "title": "PROC leaving · restore and finish",
    "group": "History & utilities",
    "paragraphs": [
      "The exit routine writes Goodbye, sends the fixed hardware control word, restores keyboard settings with *FX, and calls PROC RC before END stops the program.",
      "The hardware word is preserved literally. The source alone cannot prove the attached equipment’s physical state after that word is sent."
    ]
  },
  {
    "start": 10640,
    "title": "PROC typepoint · enter a coordinate pair",
    "group": "History & utilities",
    "paragraphs": [
      "The user enters x,y text; the comma separates two VAL conversions. Valid input is inserted after the editing point and recorded as Add in history.",
      "Line 10790 checks nx<0, ny<0, ny>600 and ny>250. The repeated ny means there is no nx>600 check in that condition. This appears to be a typo; the archive explains it without changing it. The actual movement routine has a separate step-space boundary check."
    ]
  },
  {
    "start": 10930,
    "title": "PROC starcommands · an OS command prompt",
    "group": "History & utilities",
    "paragraphs": [
      "The application temporarily restores cursors and accepts star commands through OSCLI until a blank line. Its original message warns that misuse may crash the program.",
      "This provides direct access to the original operating environment. The archive only displays these commands and does not execute them in the website."
    ]
  },
  {
    "start": 11090,
    "title": "PROC helpsummary · keyboard reference",
    "group": "History & utilities",
    "paragraphs": [
      "The summary replaces the graph with a list of keyboard actions, waits for a key, then redraws. The text describes arrow navigation even though the corresponding character strings in the supplied main loop look like spaces.",
      "The help itself is primary evidence of the intended user interface. Its catalogue spelling and spacing are preserved along with the executable statements."
    ]
  },
  {
    "start": 11350,
    "title": "PROC transform · equations over a selection",
    "group": "Transforms & settings",
    "paragraphs": [
      "A single index or a hyphen-separated range selects points, with endpoints reordered and clamped. Node zero is excluded. The user then supplies expressions for new X and Y coordinates.",
      "For each point, both lowercase and uppercase x/y variables are populated before EVAL evaluates the expressions. A first pass rejects results outside the graph before any point is changed.",
      "A second pass records each old/new pair as MegaMove, bracketed by MegaMoveEdge entries for grouped undo, then assigns the new coordinates. This is expression-driven editing in the original BASIC interpreter, not a feature re-executed by the archive."
    ]
  },
  {
    "start": 11760,
    "title": "PROC showedit · current point in help",
    "group": "Transforms & settings",
    "paragraphs": [
      "The routine formats the selected index and its stored coordinates into the help panel. LEFT$ limits each coordinate’s displayed string to six characters; it does not round or modify the stored value."
    ]
  },
  {
    "start": 11800,
    "title": "PROC playsample · text and speech cues",
    "group": "Transforms & settings",
    "paragraphs": [
      "The names Please, Insert and Wire select three text messages and fixed slices of the sample buffer. The Insert message explicitly mentions foam, establishing the material described by the original user interface.",
      "When speech is enabled, B% and C% become start/end addresses for the assembly routine. A special 32-bit output word is sent for playback, CALL playsample runs, then PROC out32 restores the normal state.",
      "The Wire branch beeps when speech is off. An unrecognised sample name raises an internal error. Text messages are shown independently of whether the recording is played."
    ]
  },
  {
    "start": 12000,
    "title": "PROC loadsamples · external recordings",
    "group": "Transforms & settings",
    "paragraphs": [
      "OSCLI loads Please, Insert and Wire from the application directory into consecutive slices of sa%. The byte lengths used by PROC playsample match these offsets.",
      "The original Please,ffd, Insert,ffd and Wire,ffd files have now been supplied and are available in the Audio & data tab. Their 84,224, 43,008 and 88,832 bytes exactly match these buffer offsets and lengths. Browser previews use the original data with an added WAV header; the original files remain downloadable."
    ]
  },
  {
    "start": 12060,
    "title": "PROC savesetup · confirm persistence",
    "group": "Transforms & settings",
    "paragraphs": [
      "A modal prompt asks whether to save the current setup. Only Y/y invokes PROC dosavesetup, after which the window, pointer and help state are restored. Shape data is saved separately."
    ]
  },
  {
    "start": 12140,
    "title": "PROC dosavesetup · serialise configuration",
    "group": "Transforms & settings",
    "paragraphs": [
      "The SetUp file contains zoom, viewport offsets, grid, snap/visibility flags, temperature settings, disable flags, speech and disc selection in a fixed order.",
      "BPUT stores byte-sized values while PRINT# stores the two real viewport offsets. The reader must use the matching operations in the same order; this is a compact application-specific format, not plain text or JSON.",
      "The supplied SetUp,ffd is 21 bytes. It stores zoom 2, zero viewport offsets, a 10 mm grid, snap and grid visibility enabled, cutting setting 90, normal setting 0, no disabled motors, speech off and disc 0. The two zero viewport values occupy six bytes each in BASIC’s file representation; the other settings use single bytes."
    ]
  },
  {
    "start": 12300,
    "title": "PROC loadsetup · restore optional settings",
    "group": "Transforms & settings",
    "paragraphs": [
      "If OPENIN finds a SetUp file, the routine reads the configuration in exactly the order used by the writer. If no file is found, the defaults established at startup remain.",
      "BPUT stores the low byte of TRUE (-1) as 255. The expression -BGET#/255 reconstructs -1 from 255 and 0 from 0 for the Boolean flags. No file-version or range-validation scheme is present in this routine.",
      "The supplied SetUp file has the speech flag set to zero. Recorded speech would therefore be disabled when loading that saved configuration, despite the separate initial default speach% = TRUE."
    ]
  },
  {
    "start": 12480,
    "title": "PROC nearest · round to grid spacing",
    "group": "Transforms & settings",
    "paragraphs": [
      "Adding half a grid interval, integer-dividing by the interval and multiplying back rounds a nonnegative coordinate to a grid multiple. The same calculation applies independently to X and Y.",
      "If rounding exceeds 600 or 250, one grid interval is subtracted. This suits coordinates already near the working area; it is not a general clamp for arbitrary out-of-range input, and it contains no separate lower-bound check."
    ]
  },
  {
    "start": 12540,
    "title": "PROC printdisctype · the current disc label",
    "group": "Transforms & settings",
    "paragraphs": [
      "The current display name is wrapped in parentheses, padded to a fixed width and printed in the File heading. Its associated filing-system path remains in the second column of discs$."
    ]
  },
  {
    "start": 12600,
    "title": "PROC changedisc · cycle through filing systems",
    "group": "Transforms & settings",
    "paragraphs": [
      "The selected index advances and wraps to zero after discs% entries. The heading redraws and the routine waits for the mouse button to be released, making each click select one destination."
    ]
  },
  {
    "start": 12670,
    "title": "FN convertfilename · resolve a filing-system path",
    "group": "Transforms & settings",
    "paragraphs": [
      "A name containing a colon is treated as already qualified and returned unchanged. Otherwise the routine prefixes the selected disc’s path and an Acorn dot separator.",
      "The final numbered blank line 12700 is retained below. This completes the supplied listing; no routines or intervening original lines have been omitted from this annotated view."
    ]
  }
];
