/* Retrospective notes; the original tokenised BASIC and decoded listing are preserved separately. */
const thingsAnnotations = [
  {
    "start": 10,
    "title": "Memory, sprites and music",
    "paragraphs": [
      "The opening reserves 40,001 bytes for the system sprite area, 16,385 for tile storage and 20,001 for assembled ARM code (BBC BASIC DIM includes offset zero). OS_SpriteOp &10A loads Sprites into the reserved area. QTMLoad loads Amber for the title music; both resources are in the supplied application directory.",
      "b% is 256, cells% is 32 and nobj% is 256. map% is a byte-addressed tile map with a 256-byte row stride and an extra allocated row; maze% is the smaller integer array used to design its connectivity. obj% holds 256 records spaced 64 bytes apart. The DIM operations reserve space; the later initialisers decide which fields are valid.",
      "ON ERROR installs PROC error, and RND(-TIME) seeds BASIC’s random generator from the centisecond clock. The ARM engine also has its own shift-and-XOR generator, defined later; the two random streams are separate."
    ]
  },
  {
    "start": 160,
    "title": "Title text, instructions and tile characters",
    "paragraphs": [
      "The DATA statements contain the title, Thomas Newcomb’s credit, the August 1996 date, the aim and the controls. FN ttw packs four character tile numbers into a word, allowing the instructions to be written into the map as tiles.",
      "The 36 DATA strings are twelve characters wide. The three words generated for each line contain four tile numbers apiece. This explains the otherwise unusual LEFT$/MID$/RIGHT$ calls: the instructions become map content that the same tile renderer can scroll, rather than a separate text overlay."
    ]
  },
  {
    "start": 610,
    "title": "Main loop and end-of-game states",
    "paragraphs": [
      "The game selects MODE 9, applies the Palette file, starts tracker music for the title and stops it before play. The inner loop calls ARM movement and drawing routines around WAIT. E% counts down transitions triggered by all enemies being defeated or the player’s type becoming 50.",
      "G% = obj% and H% = map% supply the object-list and map bases used by the machine-code routines. The main loop keeps callable addresses in M% and N% and the counter/player pointers in O% and P%, avoiding repeated name lookup while stepping and drawing.",
      "The 100 in nastiesleft is a percentage-style counter for 50 enemies, not an initial population of 100. Each enemy death subtracts two at lines 7640–7660. When it reaches zero E% starts at -400; player type 50 instead starts a -200 countdown. The equality tests at -201 and -1 select victory or return-to-title behaviour after the delay."
    ]
  },
  {
    "start": 880,
    "title": "PROC didit — completion sequence",
    "paragraphs": [
      "The completion sequence plays named sound voices, wipes the display with lines and draws the large nastie sprite. It then repeatedly copies rectangles with random offsets, producing a disturbed image rather than a conventional static victory screen.",
      "The sound calls store a pitch word immediately before the voice name in B%. Cheer uses &0800, then HTBigNDeat uses &1B00. makesound expects exactly that pointer arrangement. The rectangle copy operations use coordinates and extents sampled inside the current bounds; this is a destructive animation of the framebuffer, not a change to the map."
    ]
  },
  {
    "start": 1140,
    "title": "FN ttb — character-to-tile conversion",
    "paragraphs": [
      "CASE TRUE tests character classes in order. Space maps to empty tile 0; period, comma, copyright and ampersand use 252–255, while slash and apostrophe use 188 and 189. Digits begin at 190, uppercase letters at 200 and lowercase letters at 226.",
      "The comparisons rely on the input being drawn from the title/instruction strings. This is not a general-purpose character decoder: a character below \"9\" that is not handled earlier would also enter the digit branch. The map uses the returned byte as a numbered sprite index."
    ]
  },
  {
    "start": 1280,
    "title": "FN ttw — pack four text tiles",
    "paragraphs": [
      "Four calls to FN ttb convert a four-character string into tile numbers. Shifts of 0, 8, 16 and 24 put them in the four bytes of one word.",
      "On the little-endian ARM, writing that word with BASIC’s ! indirection places those four tile bytes into consecutive map cells in reading order. PROC maptext uses three such writes for each twelve-character line."
    ]
  },
  {
    "start": 1310,
    "title": "PROC setupobj — the 64-byte object record",
    "paragraphs": [
      "obj% is a manually laid-out record array: record i begins at obj% + i * 64. BASIC’s ! indirection reads or writes a 32-bit word; ARM uses the same byte offsets with LDR/STR. There is no separately declared struct. The field meanings below are inferred by following the routines that consume each offset.",
      "Record 0 is the player: type 64, arrows 100, magic 100, health 100 and a map pointer near the lower-right entrance. Records 1–50 are nasties: type 96–98, arrows 20, magic 100 and health 15. The placement loop retries until it finds an empty map byte. The sprite type and movement behaviour are selected independently.",
      "A nasty’s behaviour at +20 is 0, 1 or 2. Type 0 stores an actual byte displacement from eightdirs at +12; types 1 and 2 store an even direction index (0, 2, 4 or 6). Its period at +40 is 1 + RND(20), hence 2–21 handler calls. +44 starts at 1 so it acts on the first visit, then reloads the period.",
      "Records 51–255 become available by clearing only their type word to zero. findemptyobj treats that word as the allocation flag; it does not require every byte of the record to be zero. Each projectile constructor must therefore initialise the fields its handler will read. The record is a tagged union in modern terms: its type selects both its update routine and how the remaining words are interpreted."
    ],
    "fields": [
      [
        "+0",
        "Type / sprite / dispatch tag. 0 = free; player 64–67; nasties 96–98; arrows 128–131; fireball 132; lightning 136; sword 140–143. Body/death states use other tags."
      ],
      [
        "+4, +8",
        "Projectile X and Y. Arrows use integer tile coordinates. Fireballs and lightning use 16.16 fixed-point coordinates centred with &8000. Player/nasty placement instead uses +36."
      ],
      [
        "+12",
        "Type-dependent movement field. A random walker stores a map-byte displacement; a side follower stores a direction index. Arrows store X velocity, lightning X velocity in fixed point, and a fireball stores its target object pointer. The player is initialised with 2 here, but the player movement handler uses its type word for facing."
      ],
      [
        "+16",
        "Arrow Y velocity or lightning fixed-point Y velocity. Not set by PROC setupobj for the player/nasties."
      ],
      [
        "+20",
        "Nasty behaviour selector: 0 = nmrndwalk, 1 = chugg, 2 = ahugg. Do not assume this meaning for every object type."
      ],
      [
        "+24",
        "Arrow stock: player 100, nasty 20. makearrow consumes one only when a free projectile record exists and stock is sufficient."
      ],
      [
        "+28",
        "Magic: player and nasty 100. Fireball costs 10, lightning costs 2, healing transfers one point to health; milk pickups replenish it."
      ],
      [
        "+32",
        "Health: player 100, nasty 15. checkcollision subtracts the attack’s damage; its BMI death test triggers when the result is negative, not when it is exactly zero."
      ],
      [
        "+36",
        "Absolute address of the occupied map byte. Used for rendering, collision, targeting and camera position. New moving projectiles start with zero until their handler places them."
      ],
      [
        "+40",
        "Nasty movement-period reload, 2–21 calls. Other handlers reuse it: fireball uses a short update divider; burningbody uses it as an animation reload."
      ],
      [
        "+44",
        "Nasty countdown (initially 1). Reused as projectile lifetime, sword age or body-animation countdown according to type."
      ],
      [
        "+48–+63",
        "No field accesses identified in the supplied source. Reserved/unused space within the 64-byte stride; no additional meaning is assumed."
      ]
    ]
  },
  {
    "start": 1630,
    "title": "FN t — map occupancy test",
    "paragraphs": [
      "This compact function reads map% at (Y% + 16) * b% + X% + 16 and returns whether the byte is nonzero. The +16 offsets place the test in a local window around an origin. It tests occupancy, not a specific wall or enemy class."
    ]
  },
  {
    "start": 1650,
    "title": "PROC buildblocks — BASIC-to-ARM bridge",
    "paragraphs": [
      "The BASIC wrapper calls the assembled buildblocks entry. That routine turns named sprites into a fixed-size, byte-indexed tile store. Keeping this separate from PROC ass lets the assembler be built once before the pixels are copied."
    ]
  },
  {
    "start": 1690,
    "title": "PROC createmap — maze to tile map",
    "paragraphs": [
      "The map is cleared, the side corridor and title text are placed, and PROC maze creates connectivity. Horizontal and vertical boundaries are expanded into eight-tile runs, with distinct door tiles. Corner masks choose the junction sprites. An entrance is cut near the lower edge.",
      "Connectivity bits 1 and 8 govern the vertical and horizontal walls drawn here; separate bits 16 and 128 indicate doors on those boundaries. A logical maze cell expands to an eight-tile interval. The corner pass inspects four neighbouring wall flags and maps the resulting four-bit mask to junction tiles 16–30."
    ]
  },
  {
    "start": 2420,
    "title": "PROC maptext — write instructions into the map",
    "paragraphs": [
      "The text starts at byte offset 754 in map%. Each successive line advances 512 bytes, or two map rows. Three word writes install twelve character tiles. The trailing constants write a border/junction pattern after the last text line, fitting the instructions into the right-hand corridor."
    ]
  },
  {
    "start": 2530,
    "title": "PROC emptylevel — clear the main map interior",
    "paragraphs": [
      "The nested loops clear columns 1–239 for rows 1–255, preserving the outer edges and the right-side text corridor. Its call inside PROC startscreen is commented out in this copy, so normal startup keeps the generated maze."
    ]
  },
  {
    "start": 2610,
    "title": "PROC createmap2 — pickups",
    "paragraphs": [
      "Twenty-one empty map locations receive tile numbers 40–45 in rotation. The source labels this section milk. Placement retries until an empty byte is found, so pickups do not replace walls.",
      "N% runs from 0 to 20 inclusive, so 21 items are attempted. N% MOD 6 selects one of six milk/resource tiles. The repeat loop refuses occupied cells; placement has no attempt limit, so it relies on the generated map having sufficient empty space."
    ]
  },
  {
    "start": 2730,
    "title": "PROC maze — boundaries and doors",
    "paragraphs": [
      "The maze has 32 logical cells per dimension, with sentinel boundaries. After recursive carving, 100 random horizontal and vertical door placements alter paired cell flags. A final paired change creates the entrance door. Door flags are separate from ordinary passage flags.",
      "Bits 1, 2, 4 and 8 describe passages in the four directions. Sentinel boundary cells are pre-marked nonzero so the recursive walker will not enter them. Door insertion updates both cells sharing a boundary: 32/128 for one orientation and 64/16 for the other, while clearing the ordinary passage bits that the map-expansion pass examines."
    ]
  },
  {
    "start": 2950,
    "title": "PROC recmaze — recursive passage carving",
    "paragraphs": [
      "Each call chooses one of four starting directions, then tries all four in cyclic order. An unvisited neighbour receives the opposite passage bit, the current cell receives the forward bit, and the routine recurses. This is depth-first maze generation; the browser demonstration shows this stage before doors and map expansion.",
      "The important distinction is that D% and N% are LOCAL but NX% and NY% are shared temporaries. Each neighbour coordinate is consumed by the recursive call before the parent tries the next direction. Setting the reciprocal passage bit also marks the new cell visited, preventing cycles during this carving stage."
    ]
  },
  {
    "start": 3160,
    "title": "PROC setupscreen — resource display",
    "paragraphs": [
      "The right-hand panel prints vertical headings for Health, Magic, Arrows and Nasties, then the title and author. Four rectangular bars are drawn; ARM code later updates the values.",
      "The bars are ordered Health, Magic, Arrows, Nasties, matching alterbar indices 0, 1, 2 and 3 used by the ARM routines. The game names are printed separately from the resource values; alterbar updates graphics rather than rewriting these headings."
    ]
  },
  {
    "start": 3390,
    "title": "PROC startscreen — prepare and animate the title",
    "paragraphs": [
      "The routine draws the title, creates the maze, scatters pickups and initialises all object records before accepting a start key. Waiting for INKEY -129 to report no key first avoids immediately consuming a held key from the previous screen.",
      "Idle time is measured in TIME centiseconds. After three seconds the routine repeatedly distorts vertical and horizontal strips using sine offsets, checking for a key inside each loop. It then scrolls the screen and slides the Title sprite back into place. Key detection exits to the already prepared game state."
    ]
  },
  {
    "start": 3880,
    "title": "PROC drawtitles — title sprite and control guide",
    "paragraphs": [
      "OS_SpriteOp draws the original Title sprite, then PRINT writes the keyboard controls. The bottom message initially says the map is being created. PROC startscreen replaces that text with the start prompt only after map generation, pickups and object setup have completed."
    ]
  },
  {
    "start": 4010,
    "title": "PROC kk — wait for a fresh key press",
    "paragraphs": [
      "Two polling loops first wait for all keys to be released and then for a key to be pressed. This is a keyboard-edge wait, distinct from FN keyonce, which emits per-action checks into the ARM engine."
    ]
  },
  {
    "start": 4060,
    "title": "PROC ass — assemble the ARM engine",
    "paragraphs": [
      "The FOR loop uses OPT 0 and OPT 2 for two assembler passes, resetting P% to mc% each time. The first resolves labels, while the second can assemble forward references with checking enabled. Later FN keyonce, FN rnd and FN div calls emit instruction sequences inline. Assembly finishes at lines 16130–16150."
    ]
  },
  {
    "start": 4120,
    "title": "buildblocks — copy numbered sprite pixels",
    "paragraphs": [
      "The assembler asks OS_SpriteOp for sprites named 0–255. Existing sprites contribute two groups of eight registers: 64 bytes per tile. Missing entries advance the destination without copying. This gives direct indexed access during map rendering.",
      "The tile-store stride is 64 bytes, and the copy performs two 32-byte register transfers per sprite. drawmap later consumes eight words (32 bytes) for each 8 × 8, 4-bit tile. The source does not explain the extra copied bytes, so the notes preserve this distinction rather than inferring an additional animation frame."
    ]
  },
  {
    "start": 4380,
    "title": "drawmap — scrolling tile renderer",
    "paragraphs": [
      "The camera follows the player’s map address, clamped near the edges. Each tile byte selects a 64-byte sprite block. Eight screen rows are written with a 160-byte stride, drawing a 32 × 32 tile viewport directly into screen memory.",
      "An object stores an absolute map address at +36. Subtracting map% yields an index: its low eight bits are X and the remaining bits are Y because each row is 256 bytes. Subtracting 16 centres the viewport on the player; the clamping avoids reading outside the visible map limits.",
      "Each map byte is shifted left six to select its 64-byte tile slot. The eight loaded words are written one per screen scanline, advancing by 160 bytes. After eight rows, the write pointer moves across to the next tile. This is a direct framebuffer blitter; it does not issue a sprite SWI for every tile."
    ]
  },
  {
    "start": 4780,
    "title": "moveobjects — type-indexed dispatch",
    "paragraphs": [
      "The object type selects a branch in a jump table. The BASIC assembler deliberately moves P% to build entries at specific indices. Player, enemy, arrow, fireball, lightning, sword and body states share the same record array.",
      "R6 points at the current record, R7 is the map base, R8 counts records and R9 holds the object type. endobject advances R6 by 64 and decrements R8. Dispatch entries for unused type ranges are left as data/space by moving P%; valid constructors and state changes must supply one of the implemented tags."
    ]
  },
  {
    "start": 5260,
    "title": "Object-handler register conventions",
    "paragraphs": [
      "The original ARM comments define R6 as the current record, R7 as the map base, R8 as the remaining object count and R9 as the current type. Several handlers use R5 for the address of the object’s map byte. These conventions connect the manually laid-out records to the machine-code update loop."
    ]
  },
  {
    "start": 5300,
    "title": "printbody — leave a body tile and release its record",
    "paragraphs": [
      "The handler writes the type byte to the saved map address, then clears the record’s type word to zero. The body remains as map data while the object slot becomes reusable. This separates persistent scenery from actively updated objects."
    ]
  },
  {
    "start": 5370,
    "title": "printmybody — retain the player death state",
    "paragraphs": [
      "The player variant writes its death tile to the map but does not free its record. The BASIC main loop checks the first record for type 50 to trigger the player-death countdown, so clearing it here would lose that signal."
    ]
  },
  {
    "start": 5420,
    "title": "sword — short-lived attack object",
    "paragraphs": [
      "The counter at +44 is incremented each visit; reaching five clears the map position and ends the object. On the first visit the sword checks collision at its precomputed position, with damage 20 and death-state tag 39. Surviving attacks write their sword type into the map before returning through endobject."
    ]
  },
  {
    "start": 5720,
    "title": "arrow — projectile movement",
    "paragraphs": [
      "An arrow removes its old map tile, adds velocity to its coordinates, calculates its next map address and tests the destination. Collision can clear the object; surviving arrows put their type into the new map byte.",
      "LDMIB reads +4, +8, +12 and +16 as X, Y, delta-X and delta-Y. Arrows therefore use integer tile positions, unlike the fixed-point magic projectiles. A new arrow’s +36 is zero, so its first update does not try to erase an old tile. Collision damage is 15 and the selected death tag is 38."
    ]
  },
  {
    "start": 6020,
    "title": "burningbody — cycle the burning animation",
    "paragraphs": [
      "The body writes its current tile, decrements +44 and reloads that countdown from +40 when it expires. At a reload it advances the type, wrapping 38 back to 34. The record is not freed by this loop, so the burning body remains an animated object rather than becoming a static tile."
    ]
  },
  {
    "start": 6180,
    "title": "fireball — follow a target with fixed-point movement",
    "paragraphs": [
      "A fireball uses +4/+8 for 16.16 X/Y and +12 for a target object pointer. The short divider at +40 alternates between a movement update and a redraw-only visit. Each movement update also decrements lifetime +44, initialised to 128 by makefba.",
      "The direction helper is called again during movement, so the fireball recomputes its direction toward the stored target rather than holding a fixed velocity. It checks the next map byte with damage 10 and death tag 34. Obstacles can clear the record; live fireballs store the updated coordinates and write tile 132."
    ]
  },
  {
    "start": 6660,
    "title": "findscreen — locate the framebuffer",
    "paragraphs": [
      "OS_ReadVduVariables reads variable 148 using the vduvin list, terminated by -1. The returned screen address is stored in the nearby screen word for drawmap and alterbar. This is how the engine obtains its framebuffer pointer instead of assuming a fixed screen address."
    ]
  },
  {
    "start": 6760,
    "title": "lightning — fixed velocity, lifetime and bouncing",
    "paragraphs": [
      "Lightning reads X, Y, delta-X and delta-Y from +4 through +16. Positions and velocities use 16.16 fixed point. Each visit removes the previous tile, decrements lifetime +44, and proposes a new position by adding the two velocities.",
      "An occupied destination is tested for damage 5 with death tag 34. Tiles below 64 also enter lightbounce, which can alter the velocity. After the result is resolved, the four movement words are stored back and tile 136 is placed at the chosen map address. The constructor starts the lifetime at 255."
    ]
  },
  {
    "start": 7100,
    "title": "checkcollision — locate and damage an object",
    "paragraphs": [
      "Inputs are described by the original comments: R10 is the map address, R11 the amount of health to remove, R12 the replacement death type and R0 the encountered map tile. Only tags 64–127 enter the object scan; other categories return immediately.",
      "The scan searches records for both the same +36 address and the same type, avoiding a match against an unrelated object. It loads health from +32, updates the player’s bar through hurtme when appropriate, then subtracts damage. BMI branches to kill only for a negative result; exactly zero is stored as a surviving health value."
    ]
  },
  {
    "start": 7360,
    "title": "hurtme — player health display and hit sound",
    "paragraphs": [
      "The caller still holds the player’s old health in R4. hurtme calculates the reduced bar value and calls alterbar with index 0, then plays HTHit. It does not itself write +32: checkcollision performs the actual health update after this helper returns. The embedded pitch word is &2800."
    ]
  },
  {
    "start": 7490,
    "title": "killmoi — player-specific death transition",
    "paragraphs": [
      "This helper plays HTMyDeath and changes the selected death type in R12 to 50. kill then writes that tag into the player record. Type 50 is also the condition the BASIC main loop watches to start its delayed return to the title screen."
    ]
  },
  {
    "start": 7580,
    "title": "kill — replace the state and count defeated nasties",
    "paragraphs": [
      "The record’s type changes to the death tag supplied by the attack, or 50 after killmoi handles the player. Enemy deaths subtract two from nastiesleft and update bar 3, then play HTNastyDea. With 50 initial enemies this makes the counter run from 100 to zero in steps of two.",
      "The following words hold the sound pitch/name and shared pointers to the map, tile blocks and object list. The health, magic and arrow fields are not universally cleared on a death transition: the replacement handler determines which remaining words still matter."
    ]
  },
  {
    "start": 7840,
    "title": "lightbounce — lightning reflection",
    "paragraphs": [
      "The reflection code inspects adjacent map bytes and reverses horizontal or vertical components as needed. Diagonal cases test surrounding positions before deciding whether the bolt continues or dies.",
      "The map positions +/-256, +/-1, and their diagonal combinations represent neighbouring cells because b% is 256. RSB with zero negates a velocity component, implementing a horizontal or vertical reflection. This is local tile collision logic, not a geometric ray trace against arbitrary surfaces."
    ]
  },
  {
    "start": 8280,
    "title": "man — player movement and controls",
    "paragraphs": [
      "The player handler polls keys, checks movement against map contents and calls action routines. Key data appears later in the assembled block. The negative key numbers are RISC OS OS_Byte key identifiers, not browser key codes.",
      "Up/down movement is proposed and validated before left/right movement, so a frame can advance on both axes. testnewpos accepts empty tile 0 or entrance tile 8. The player’s facing is recorded in types 64–67; it is used by forward arrows, the sword and pickup direction.",
      "Most action keys are expanded through FN keyonce, allowing one action per new press. Healing is polled differently: holding H can transfer one magic point to health on each visit. keyheallast suppresses repeated healing sounds while the key remains held, rather than suppressing repeated healing itself."
    ]
  },
  {
    "start": 8920,
    "title": "testnewpos — traversable player tiles",
    "paragraphs": [
      "The helper returns the comparison flags after accepting either tile 0 (empty) or tile 8 (the entrance). The movement code uses those flags to keep or reject a proposed map position. keyheallast is stored immediately afterward for the healing sound’s press-state check."
    ]
  },
  {
    "start": 8990,
    "title": "mkarwu / mkarwd / mkarwl / mkarwr / mkarwf — arrow direction",
    "paragraphs": [
      "The four cardinal entry points set integer velocity components and arrow types 128–131, then branch to makearrow. mkarwf derives the cardinal entry from player types 64–67 so keypad 5 fires in the facing direction. These are setup wrappers; allocation and resource checks are in the next section."
    ]
  },
  {
    "start": 9230,
    "title": "makearrow — allocate and launch an arrow",
    "paragraphs": [
      "findemptyobj returns a free record in R3 or zero. If none is available, makearrow returns before consuming ammunition. It then reads arrows at +24 and subtracts one; a negative result aborts without writing the new value. For the player, bar 2 is updated after a successful deduction.",
      "The firing object’s +36 map pointer is decoded into integer X/Y. STMIB writes the new arrow’s X, Y, delta-X and delta-Y into +4 through +16, and the selected arrow tag is stored at +0. +36 starts at zero, telling the first arrow update that there is no old map tile to erase. Finally HTArrow plays at pitch &2000."
    ]
  },
  {
    "start": 9570,
    "title": "heal — convert magic into health",
    "paragraphs": [
      "Healing requires magic at +28 to be greater than zero and health at +32 to be below 100. A successful visit subtracts one magic point and adds one health point, writing both fields and updating bars 1 and 0 respectively.",
      "man calls heal while H is held, so this operation can repeat across game updates. HTHeal is played only when keyheallast was zero, avoiding a fresh sound on every transferred point. Healing does not allocate an object record and is independent of arrow creation."
    ]
  },
  {
    "start": 9850,
    "title": "makefb — choose a visible fireball target",
    "paragraphs": [
      "This player-action wrapper calls findnearest, then calls makefba only if it receives a nonzero target record. Target selection and projectile construction are separate: nasties can call the construction entry directly with the player as their target."
    ]
  },
  {
    "start": 9910,
    "title": "makefba — construct a fireball",
    "paragraphs": [
      "The constructor first finds a free record and then checks that the firing object has at least 10 magic at +28. It deducts that amount and updates bar 1 only when the firing record is the player.",
      "It decodes the source map pointer and creates centred 16.16 coordinates at +4/+8, stores the target pointer at +12, and sets type 132. +44 is lifetime 128, +40 starts at 1 for the update divider and +36 starts at zero. HTFireBall plays at pitch &2600. The handler later recomputes direction toward the target."
    ]
  },
  {
    "start": 10330,
    "title": "makelight — choose a visible lightning target",
    "paragraphs": [
      "Like makefb, this player wrapper asks findnearest for a visible nasty and returns if there is none. On success it forwards the target displacement to makelighta. The latter is also used directly by the enemy firing path."
    ]
  },
  {
    "start": 10390,
    "title": "makelighta — construct a lightning bolt",
    "paragraphs": [
      "A free object record and at least two magic points are required. After deducting magic, the player’s magic bar is updated when applicable. The source map pointer is converted to centred 16.16 X/Y, and the supplied direction components go into +12/+16.",
      "The bolt receives type 136, lifetime 255 at +44, and a zero previous map address at +36. HTLightnin uses pitch &2000. Unlike the fireball’s stored target pointer, these direction fields are velocities that lightbounce can subsequently reflect."
    ]
  },
  {
    "start": 10800,
    "title": "findemptyobj — scan the free-list flag",
    "paragraphs": [
      "Starting at objectlist, the routine examines each type word and advances by 64 bytes until it finds zero. It returns the record pointer in R3, or R3 = 0 after exhausting nobj% records. This is a linear scan over a fixed pool, not a separately linked free list."
    ]
  },
  {
    "start": 10940,
    "title": "findnearest — closest visible nasty",
    "paragraphs": [
      "The scan advances from the caller’s record through following records. Masking off the low five type bits and comparing with &60 selects the nasty type range. caniseeyou supplies a distance or -1 for blocked/dead-target cases; unsigned comparison rejects that -1 sentinel.",
      "When a candidate is closer, the record pointer and direction components are stored in nearobjpos, neardx and neardy. On return the nearest visible candidate is loaded into R0/R1/R2, or R0 is zero when no candidate qualified. Because the scan starts after the caller, it is not a general all-pairs nearest-neighbour function."
    ]
  },
  {
    "start": 11220,
    "title": "openclose — doors in the tile map",
    "paragraphs": [
      "Door interaction works by modifying runs of map bytes. Separate horizontal and vertical paths select their strides; the opening and closing loops exchange door tile values. HTDoor accompanies the change.",
      "The player’s type determines its facing and therefore which adjacent boundary to inspect. Separate horizontal and vertical paths select a stride of 1 or 256. The loops replace runs of closed-door tile values with their open counterparts (or reverse that change), then play HTDoor. Door state is thus stored directly in the map rather than in another object record."
    ]
  },
  {
    "start": 12020,
    "title": "nasties — erase, count down and dispatch",
    "paragraphs": [
      "Each visit removes the nasty’s old tile before examining its timer. +44 is decremented and reloaded from +40 when it reaches zero. Nonzero countdowns skip movement and firing but still pass through endofmovenast to restore the tile.",
      "At expiry, +20 chooses one of three movement policies: 0 random walking, 1 chugg, 2 ahugg. Their field at +12 has different representations, set consistently by PROC setupobj. Sprite types 96–98 do not select these policies; all three route through this handler."
    ]
  },
  {
    "start": 12190,
    "title": "chugg / ahugg — opposite-side wall followers",
    "paragraphs": [
      "chugg puts +1 in R4; ahugg puts -1. The shared code uses that sign to inspect a side direction (+/-2 slots in eightdirs) and a rear diagonal (+/-3 slots). An empty side with an occupied rear diagonal turns toward that side. Otherwise an occupied forward tile causes a quarter-turn away.",
      "The final direction index is masked to 0–7 and stored at +12. The nasty moves only if the chosen destination is empty, then proceeds to decidefire. The direction table is extended before and after eightdirs so intermediate signed indices remain within the repeated table entries."
    ]
  },
  {
    "start": 12490,
    "title": "decidefire — weighted attack selection",
    "paragraphs": [
      "After saving the current position, FNrnd emits four updates and the low four bits select an action. ARM’s PC value points eight bytes ahead, so selector 0 reaches nfireball, 1–3 reach nlightning, 4–7 skip the shot, and 8–15 fall through to ntestarrow.",
      "Those are counts among the sixteen selector values, not guaranteed shot probabilities. Visibility, alignment, magic/ammunition and available object records can all prevent a selected action from producing a projectile."
    ]
  },
  {
    "start": 12650,
    "title": "nlightning — enemy lightning visibility gate",
    "paragraphs": [
      "The target pointer is set to the player record. caniseeyou must return something other than -1 before makelighta is called. R5, R8 and R9 are saved because visibility and projectile construction reuse registers needed by the enemy update loop. The constructor separately checks magic and record availability."
    ]
  },
  {
    "start": 12730,
    "title": "nfireball — enemy fireball visibility gate",
    "paragraphs": [
      "This is the corresponding player-targeted visibility check for fireballs. Passing it calls makefba, which stores the player record pointer in the new projectile and charges the nasty ten magic points. A passed visibility test alone does not guarantee creation."
    ]
  },
  {
    "start": 12830,
    "title": "ntestarrow — alignment and visibility for enemy arrows",
    "paragraphs": [
      "The nasty and player map pointers are decoded into X/Y coordinates. Only equal rows or equal columns reach an arrow entry: general diagonal aiming is not attempted. caniseeyou must then accept the path, and the sign of its displacement chooses the cardinal arrow wrapper.",
      "The shared endofmovenast tail writes the nasty’s type byte at its current map position and returns to endobject. Even a skipped movement or failed shot must do this, because the handler erased that tile at entry."
    ]
  },
  {
    "start": 13170,
    "title": "nmrndwalk — continue or choose a new direction",
    "paragraphs": [
      "The field at +12 is a byte displacement from eightdirs. The forward tile is inspected, and five random updates supply a low-five-bit gate. A zero gate changes direction even when the way ahead is clear; an occupied destination also changes direction.",
      "A direction change uses three further random updates and stores one of eight offsets without moving during that turn. Otherwise the nasty advances one tile. Both paths continue to decidefire, so failing to move does not itself prevent an attack attempt."
    ]
  },
  {
    "start": 13350,
    "title": "makesword — place a short-lived sword attack",
    "paragraphs": [
      "The player’s facing type indexes a doubled direction-table stride so the sword position is one map tile ahead. A free object receives the corresponding sword tag 140–143, that map pointer and age zero at +44, then HTSword plays.",
      "This routine does not deduct magic or arrows. Its handler later resolves collision and lifetime. The original stack/return sequence on the no-free-record path is unusual and should not be silently rewritten by the annotation; this is a reading of the supplied source, not a repaired engine."
    ]
  },
  {
    "start": 13600,
    "title": "pickup — inspect the tile ahead",
    "paragraphs": [
      "The player’s facing indexes the same cardinal-direction table scheme used by makesword. Subtracting 40 from the encountered tile number turns milk tiles 40–45 into selectors 0–5. Only that unsigned range reaches milk; any other tile returns without changing state."
    ]
  },
  {
    "start": 13760,
    "title": "milk — replenish magic from a pickup",
    "paragraphs": [
      "The selector chooses a gain of (selector + 1) * 8, hence 8, 16, 24, 32, 40 or 48 magic points. If the resulting magic would exceed 100, the routine returns without taking the item: it refuses the pickup rather than clamping the value.",
      "A successful pickup writes +28, updates the magic bar, clears the item’s map byte and plays HTPickUp. Health is not directly increased here; healing is the separate magic-to-health conversion in heal."
    ]
  },
  {
    "start": 13960,
    "title": "Key bindings and previous-key words",
    "paragraphs": [
      "The negative constants are OS_Byte 129 key identifiers. Each one-shot action has an adjacent previous-state word, which FN keyonce reads and updates. keyheal is treated separately in man because healing repeats while held; its sound uses keyheallast to recognise the start of a press."
    ]
  },
  {
    "start": 14220,
    "title": "rndseed and rndeor — ARM random state",
    "paragraphs": [
      "The ARM generator starts with seed &568475 and XOR mask &1D872B41. FN rnd emits updates against those words. This is distinct from BASIC’s RND(-TIME) initialisation at line 30, so the source contains two random-state mechanisms."
    ]
  },
  {
    "start": 14250,
    "title": "eightdirs — repeated map displacements",
    "paragraphs": [
      "The named eightdirs entry begins with north (-b%), then northeast, east, southeast, south, southwest, west and northwest in clockwise order. Seven entries precede it and seven follow it, repeating the ends of the cycle.",
      "This arrangement lets the side-following code look several indices before or after its heading without first wrapping every intermediate index. Player actions also use a stride of eight bytes (two direction entries) to convert the four player-facing tags into cardinal offsets."
    ]
  },
  {
    "start": 14520,
    "title": "alterbar — resource bars",
    "paragraphs": [
      "The routine writes repeated colour words directly to screen rows with the same 160-byte stride as the tile renderer. It clamps or scales the value before updating the visual resource indicator.",
      "R0 chooses one of four bars, with R1 holding the old value and R2 the new one. A negative new value is clamped to zero, and an unchanged value returns immediately. The address is based on screen + 132 + bar * 8 + (159 - value) * 160. Decreases fill the changed interval with &60000000; increases use yellow &66666666. Reordering the two endpoints lets one 160-byte-stride loop handle both directions without redrawing the entire bar."
    ]
  },
  {
    "start": 14790,
    "title": "caniseeyou — sampled map visibility",
    "paragraphs": [
      "A target with type 50 is already the dead-player state and is rejected immediately. Otherwise direction computes signed 16.16 increments and a major-axis distance. Starting half a tile into the source cell, the loop samples intermediate positions, stopping before the target cell.",
      "Tile 0 passes, as do values 64 and above. Any nonzero tile below 64 blocks visibility and returns R3 = -1. Thus scenery and resource tiles can obstruct sight, while other characters and projectiles do not. On success the saved distance is returned, allowing findnearest to compare visible targets."
    ]
  },
  {
    "start": 15120,
    "title": "direction — fixed-point increments and distance",
    "paragraphs": [
      "Source and target map addresses are decomposed using the 256-byte stride. The signed displacement selects an octant. The major-axis component becomes +65536 or -65536 (one tile), and FN div calculates the fractional component for the other axis.",
      "R1/R2 return the signed 16.16 step vector and R3 the major-axis distance, equivalent to max(abs(dx), abs(dy)). This supports both visibility sampling and magic-projectile direction; it is not a Euclidean distance calculation. The many cq labels are branches within this single octant-normalisation routine."
    ]
  },
  {
    "start": 15960,
    "title": "makesound — named sound voices",
    "paragraphs": [
      "Sound_AttachNamedVoice selects one of the loaded HT modules and Sound_Control starts it. The voice counter cycles through vs% channels. These use the Acorn sound system, unlike Wire Cutter’s external printer-port audio circuit.",
      "R1 points to a zero-terminated HT voice name, with its pitch word four bytes earlier. Sound_AttachNamedVoice attaches it to the current channel; makesound then reads that preceding pitch, uses amplitude &FFF1 and duration &FF, and calls Sound_Control. The voice counter wraps through vs% channels, so later effects can reuse and interrupt a channel."
    ]
  },
  {
    "start": 16130,
    "title": "PROC ass completion — finish both assembly passes",
    "paragraphs": [
      "The closing bracket returns from assembler notation to BASIC, NEXT completes the two-pass loop begun at line 4080, and an optional nonzero brk value installs a debugger breakpoint with Breakset. ENDPROC finishes PROC ass. The following FN definitions are helpers that it called while generating code."
    ]
  },
  {
    "start": 16170,
    "title": "FN keyonce — emit a press-edge check",
    "paragraphs": [
      "The function emits ARM instructions for a particular key word, previous-state word and action label. OS_Byte 129 returns a current state; the two TEQ instructions arrange a call only when the state has changed and the new state is nonzero.",
      "The final STR saves the current state for the next visit. Its result is =0 because the purpose of this BASIC function is the generated instructions, not a runtime numeric answer. The original comment requires the action to preserve R1, which still carries the key state to store."
    ]
  },
  {
    "start": 16310,
    "title": "FN rnd — emit a shift-and-XOR generator",
    "paragraphs": [
      "The helper emits a loop that loads rndseed and rndeor, shifts the state left one bit and conditionally XORs the mask when the outgoing carry is set. The caller supplies the result register, loop-count register and scratch register.",
      "The loop count is prepared by the caller, so a use can advance the state several times before examining its low bits. The final state is written back to rndseed. This macro is expanded inline inside movement and firing routines; it is not a subroutine call on each random request."
    ]
  },
  {
    "start": 16420,
    "title": "FN div — emit unsigned binary division",
    "paragraphs": [
      "The helper generates a 32-step restoring division loop. Each pass shifts the numerator and quotient, brings the next numerator bit into the remainder, and conditionally subtracts the denominator. The quotient bit is set only when the subtraction is allowed.",
      "Register names are supplied as parameters so the octant branches in direction can divide different coordinate components. Signed cases are handled by those callers before and after the unsigned division; this helper itself implements the unsigned operation."
    ]
  },
  {
    "start": 16570,
    "title": "PROC error — Escape cleanup and error reporting",
    "paragraphs": [
      "The handler stops tracker playback first. Error 17 (Escape) restores MODE 9, runs KillMods to unload the HT voices and QTMTracker, and prints the farewell. Other errors are raised again with REPORT$ and the original ERL line attached, then execution ends."
    ]
  },
  {
    "start": 16680,
    "title": "PROC trackerstop — restore game sound settings",
    "paragraphs": [
      "QTMStop ends the title music. Sound_Configure requests vs% channels, 208 samples per channel and a 48-microsecond sample period. Tuning 0 restores default tuning, then Sound_Control silences every selected channel.",
      "The same routine is called between the title music and gameplay, and during error cleanup. These settings are why the archive can reconstruct isolated sound-effect playback more closely than simply guessing a rate from the sample bytes."
    ]
  }
];
