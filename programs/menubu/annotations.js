/* Modern notes, separate from David Newcomb's original source. */
const menubuAnnotations = [
  {
    "start": 10,
    "title": "Source header and credits",
    "paragraphs": [
      "The supplied file is named Menubu. The listing identifies its application as Newsagent Management and credits David Newcomb at line 40, consistent with Thomas Newcomb’s account. No year appears in this source. The original spelling and comments are preserved."
    ]
  },
  {
    "start": 80,
    "title": "Main program and menu dispatch",
    "paragraphs": [
      "PROC setvars prepares the application, then a REPEAT loop displays Main Menu. The selection O% chooses Amend, Bills, Deliveries or Quit. The code expects an external menu command to supply O%.",
      "Quit sets FINISH to TRUE; the program restores *FX 200 and prints its closing message. All later procedures remain in the complete listing below."
    ]
  },
  {
    "start": 280,
    "title": "PROC menu · shared menu layout",
    "paragraphs": [
      "MODE 12 resets the display. PROC centre prints the title and up to five options, with VDU 31 positioning the menu at text row 10. The external *SD03 command supplies the instruction line.",
      "The original comment describes a moving red bar. l$ supplies four or five option keys to *SD10. This dependency is reconstructed with keyboard and button navigation in the browser demo; the original SD module is not supplied."
    ]
  },
  {
    "start": 530,
    "title": "PROC centre · centred text",
    "paragraphs": [
      "The string length is used to prepend spaces for an 80-column text display. PRINT then outputs the padded string. This is character-cell positioning, not desktop window layout."
    ]
  },
  {
    "start": 640,
    "title": "PROC setvars · database interface and date",
    "paragraphs": [
      "*SDRESET and SYS &80301 obtain sd%, used elsewhere as a pointer to a shared string buffer. The exact external module and its documentation are not included, so the archive describes the command usage without identifying a vendor.",
      "The operator supplies day, month and a two-digit year, followed by a Sunday flag. Validation bounds the numbers but does not validate real calendar dates. These are operator-entered dates rather than readings of the machine clock."
    ]
  },
  {
    "start": 890,
    "title": "PROC bi_me · Bills menu",
    "paragraphs": [
      "The Bills menu dispatches to bill printing, calculation and payment receipt. A fourth option returns to the caller using ENDPROC. The browser menu retains these labels and order."
    ]
  },
  {
    "start": 1060,
    "title": "PROC am_me · Amend menu",
    "paragraphs": [
      "This menu routes to status updates, order changes, bill changes and holiday records. The fifth option returns to Main Menu. These actions use different database files and share the SD command interface."
    ]
  },
  {
    "start": 1240,
    "title": "PROC astatus · scheduled status changes",
    "paragraphs": [
      "The routine walks Diary records and compares three date groups against the entered date. stda/stmo/stye write status a; enda/enmo/enye write h. PROC print treats a/c as skipped records and h/m as printable states. The Home/Away comment headings should therefore be read alongside the assignments rather than taken as a verified description of their direction.",
      "Matching cancellation dates delete the diary entry and the associated Customer and Paper records. DN% and DR% capture the diary record position before opening another file; the external command’s precise end-of-file convention is not documented here."
    ]
  },
  {
    "start": 1870,
    "title": "PROC ahols · holiday diary entries",
    "paragraphs": [
      "An address lookup obtains the customer number and adds a Diary record. A failed lookup is recognised through G% = 255 and passed to PROC error.",
      "Fields 2–7 are edited through *SDEDFIELD and a confirmation loop uses G% values 78 and 89 (ASCII N and Y). The REPEAT at 1890 has no matching UNTIL before the supplied ENDPROC; this appears to be an incomplete block in the listing. The archive does not repair it."
    ]
  },
  {
    "start": 2310,
    "title": "FN getfield · numeric field access",
    "paragraphs": [
      "*SDGFIELD reads the named field and *SDSTRIP trims it. $sd% dereferences a zero-terminated string at the address sd%; VAL converts that text to a number. The leading $ is a memory-string operator, not part of a renamed variable.",
      "The function returns with = at line 2350. The following ENDPROC is present in the supplied file even though this is a DEF FN definition; it is retained rather than normalised into different executable code."
    ]
  },
  {
    "start": 2420,
    "title": "FN getfieldst · string field access",
    "paragraphs": [
      "This is the string companion to FN getfield: it returns $sd% after reading and stripping a field. It also has an ENDPROC after the function return in the supplied listing."
    ]
  },
  {
    "start": 2530,
    "title": "PROC write · printed account bills",
    "paragraphs": [
      "The routine traverses Customer records, printing the customer number, name, address, last-payment date and outstanding balance. VDU 2 enables printer output and VDU 3 disables it.",
      "The currency marker is $ in the original text; the archive does not infer a country or currency from that symbol. No real customer data is included in this upload."
    ]
  },
  {
    "start": 2850,
    "title": "PROC calc · calculation menu",
    "paragraphs": [
      "The screen offers weekly and monthly calculation and a return option, with notes to run weekly on Sundays and monthly on the first. The listing assigns CB$ = \"123\" but does not contain the *SD10 selection call used by PROC menu. Its subsequent decisions use O%.",
      "The browser exposes the formulas directly; it does not reproduce or silently repair this missing selection step."
    ]
  },
  {
    "start": 2990,
    "title": "Weekly balance calculation",
    "paragraphs": [
      "For each Customer record the routine reads bale, wbil and wech, then assigns newbil = balold + weekb + weekc and writes it to bale. It adds stored charges rather than calculating newspaper prices from the order records.",
      "There is no check here that a week has already been billed. Repeating the action would add the amounts again. The demo computes a preview rather than modifying historical records."
    ]
  },
  {
    "start": 3180,
    "title": "Monthly balance calculation",
    "paragraphs": [
      "The monthly branch adds mbil to the previous bale. It does not also add the weekly charge wech. The shared loop returns when O% = 3."
    ]
  },
  {
    "start": 3440,
    "title": "PROC abill · change stored charges",
    "paragraphs": [
      "The customer can be located by number or address. The code checks G% for not-found and blocks records whose stat field is m. It then offers editing of wbil, mbil or wech through SD field-edit commands.",
      "The controls over SD46 bracket external record editing. Their complete semantics require the missing SD module documentation."
    ]
  },
  {
    "start": 3960,
    "title": "PROC recei · receive a payment",
    "paragraphs": [
      "An address selects the customer; the entered payment WP is subtracted from bale. The routine then writes dd, mm and yy into the last-paid date fields.",
      "The browser’s payment formula follows newbal = oldbal - WP. It is an illustration using user-entered numbers, not a connection to the original database. A blank address returns from the procedure."
    ]
  },
  {
    "start": 4390,
    "title": "PROC aorder · change a paper order",
    "paragraphs": [
      "A customer address resolves cus#, which is used to find the matching record in Paper. Fields 2–7 are passed to the external editor.",
      "FOR I% = 2 TO 7 has no NEXT in this supplied routine, and the enclosing structure runs to UNTIL FALSE. This appears unfinished or malformed; the source view retains it exactly."
    ]
  },
  {
    "start": 4700,
    "title": "PROC de_me · Deliveries menu",
    "paragraphs": [
      "The five choices are printing the delivery round, adding a customer, deleting a customer, opening the Publication submenu and returning to Main Menu. Printing and customer edits use linked records rather than simply sorting names."
    ]
  },
  {
    "start": 4880,
    "title": "PROC print · start of the linked delivery round",
    "paragraphs": [
      "The original comment explicitly calls this a linked list. The routine starts with prev$ = \"00000\", searches Customer by prev, and follows the next field. It skips a/c status values and accepts h/m values.",
      "The supplied control blocks around FIRST, REPEAT and UNTIL are not consistently nested. There is also an outer REPEAT at 4940 without a closing UNTIL before ENDPROC. The browser demonstrates the intended record traversal rather than claiming to execute this procedure unchanged."
    ]
  },
  {
    "start": 5100,
    "title": "Follow the next customer",
    "paragraphs": [
      "When FIRST is false, the next identifier is used as a cus# lookup. Away or cancelled records advance next$ without producing a delivery row. FIRST distinguishes the initial lookup from subsequent records.",
      "The next fields determine order independently of physical record order. The demo shows fictitious records and explicitly follows those identifiers."
    ]
  },
  {
    "start": 5260,
    "title": "Weekday publication tokens",
    "paragraphs": [
      "After identifying a customer, Paper supplies wek1, wek2 and wek3. Each token is looked up in Publi/n and its puna field supplies the printable publication name. This is a relationship across three files: Customer, Paper and Publi/n."
    ]
  },
  {
    "start": 5440,
    "title": "Sunday publication tokens",
    "paragraphs": [
      "With sun% = 1, the corresponding sun1, sun2 and sun3 fields replace the weekday tokens. The browser’s day control illustrates this choice using invented publication names."
    ]
  },
  {
    "start": 5590,
    "title": "Print and terminate the delivery round",
    "paragraphs": [
      "Each delivery row prints the address and up to three publication names. The next field advances the walk, and \"99999\" is used as the terminating identifier. VDU 3 ends printer output and FIRST is reset for a later run."
    ]
  },
  {
    "start": 5770,
    "title": "PROC add · prepare a new customer",
    "paragraphs": [
      "The last physical Customer record supplies oldcu%, and the new identifier is oldcu% + 1. This allocation is separate from where the customer is inserted into the delivery list.",
      "Line 5810 contains IF G% = 78 OR G% = 110 ENDPROC without the THEN used elsewhere. The exact supplied statement is preserved; the archive does not claim this file runs without errors."
    ]
  },
  {
    "start": 5880,
    "title": "Choose an insertion position",
    "paragraphs": [
      "The operator navigates existing cards using <, >, comma and full stop, selects with Space and quits with Q. The selected card is described as the card after the desired insertion point.",
      "Navigation follows next and prev fields and avoids records with m status. *SDVIEW displays the selected record; its screen appearance cannot be recovered from this BASIC file alone."
    ]
  },
  {
    "start": 6390,
    "title": "Confirm or cancel insertion",
    "paragraphs": [
      "Q closes the file and returns. Space asks for confirmation and uses B$ to break out of the selection loop. The flag is reset before link changes begin."
    ]
  },
  {
    "start": 6510,
    "title": "Relink the neighbouring customers",
    "paragraphs": [
      "The selected following record’s prev field is changed to the new identifier. The preceding record is then located and its next field is changed likewise.",
      "These two updates prepare a doubly linked insertion. The new record will point backwards to b4cus$ and forwards to afcus$. A browser illustration can explain this without needing the original SD record layout."
    ]
  },
  {
    "start": 6680,
    "title": "Create and initialise the customer record",
    "paragraphs": [
      "*SDADD creates the record; next, prev and cus# are set before editable fields are exposed. The balance is initialised to zero, roun to 7 and numeric fields 12–14 to zero.",
      "Fields 5–11 are edited, with field 7 skipped by advancing I%. The database schema defining those numeric field positions is not included."
    ]
  },
  {
    "start": 7020,
    "title": "Create the associated paper order",
    "paragraphs": [
      "A corresponding Paper record receives the new customer identifier, then order fields 2–7 are edited. The source asks for asterisks in blank orders.",
      "The confirmation loop can add another customer, but the identifier and neighbour calculations occur before that loop. The listing does not clearly recompute them for each additional record; this is retained as a behaviour to investigate, not presented as verified database operation."
    ]
  },
  {
    "start": 7270,
    "title": "PROC delete · mark a customer cancelled",
    "paragraphs": [
      "After address lookup, m-status records and missing customers are rejected. The record is marked c, and its previous/next identifiers are captured before being replaced with \"000-1\".",
      "The statement at 7320 omits THEN before ENDPROC, matching a similar statement in PROC add. Source formatting inserts whitespace only; it does not repair the expression."
    ]
  },
  {
    "start": 7550,
    "title": "Bypass the cancelled customer in the list",
    "paragraphs": [
      "The record pointing to the cancelled customer is found and its next pointer is changed. The following record’s prev pointer is then updated, closing the delivery-list gap.",
      "The cancelled record is not immediately physically erased in this procedure. The next section schedules later deletion."
    ]
  },
  {
    "start": 7710,
    "title": "Schedule physical deletion",
    "paragraphs": [
      "The operator supplies the date in six months; this is not automatically computed. Diary receives cus#, cada, camo and caye. PROC astatus later compares these fields with the current entered date and removes matching records."
    ]
  },
  {
    "start": 7980,
    "title": "PROC pub_men · Publication menu",
    "paragraphs": [
      "The publication file has its own View, Add and Delete choices and a return option. This submenu uses the same shared four-option menu routine as the main menu."
    ]
  },
  {
    "start": 8150,
    "title": "PROC psee · view publications",
    "paragraphs": [
      "The routine iterates through Publi/n records and invokes the SD record viewer. A confirmation prompt allows early return before all records have been visited. The appearance and contents of these records are not supplied."
    ]
  },
  {
    "start": 8370,
    "title": "PROC padd · add a publication",
    "paragraphs": [
      "*SDADD creates a Publi/n record and *SDEDREC delegates editing of the whole record to the external database interface. A Y/N response determines whether another record is added."
    ]
  },
  {
    "start": 8560,
    "title": "PROC pdel · delete a publication",
    "paragraphs": [
      "A token selects the publication record. G% = 255 invokes PROC error; otherwise *SDDELREC deletes the located record and the file is closed. The BASIC listing does not check here for customers still using that token."
    ]
  },
  {
    "start": 8750,
    "title": "PROC error · failed lookup",
    "paragraphs": [
      "The named file is closed, “Not found...” is displayed and a keypress is awaited. This is the application’s small not-found helper, not an ON ERROR handler covering every possible interpreter or SD error.",
      "The final comments and blank numbered lines are included below. This completes the supplied Menubu listing."
    ]
  }
];
