/* Retrospective source audit; no fixes are applied to the original program. */
const ThingsBugs=(()=>{
 const groups=[
  {
    "title": "Serious: memory corruption or crash risk",
    "items": [
      {
        "title": "Sword creation continues after allocation failure",
        "lines": "13350–13530 · makesword",
        "confidence": "High confidence · reduced ARM failure-path test",
        "paragraphs": [
          "findemptyobj returns R3 = 0 when the object pool is full. The conditional LDMEQFD R13!,{R14} restores the return address but does not return. Execution continues to STR R10,[R3,#36] and STR R0,[R3], attempting writes to &24 and zero. The extra stack pop also disrupts the eventual return.",
          "A reduced ARM test reproduced the write to &24. The likely correction is an immediate return through PC on this path, using the appropriate ARM26 return convention."
        ]
      },
      {
        "title": "Collision search examines one record beyond the array",
        "lines": "7190–7270 · checkcollision",
        "confidence": "High confidence · reduced ARM failure-path test",
        "paragraphs": [
          "R5 is the address immediately after the 256 object records. The loop exits only when R3 is strictly greater than R5 (HI), so equality still permits a read from [R3,#36] outside the allocation.",
          "This requires a character-class map tile with no matching live record. Stale occupancy can arise when one projectile changes a nasty to a death state and another hits the old map tile before its next update. A reduced ARM test reproduced the out-of-bounds read. The bound should reject equality too: an unsigned greater-than-or-equal test."
        ]
      }
    ]
  },
  {
    "title": "Logical: likely unintended behaviour",
    "items": [
      {
        "title": "The maze is not cleared before a new game",
        "lines": "1690–1810; 2730–3140 · PROC createmap / PROC maze",
        "confidence": "High confidence about behaviour; intent inferred",
        "paragraphs": [
          "PROC createmap clears map%, but PROC maze only reinitialises the boundaries of maze%. The previously visited interior remains nonzero, so the next recursive carving finds no unvisited neighbours.",
          "A reproduction of the carving algorithm visited 960 cells on its first generation and only one on its second. Door placement still runs, so the resulting world is not necessarily identical: door modifications accumulate while the underlying maze is not freshly carved."
        ]
      },
      {
        "title": "Zero health still counts as alive",
        "lines": "7310–7330 · checkcollision",
        "confidence": "Definite behaviour; likely off-by-one threshold",
        "paragraphs": [
          "The BMI death branch triggers only when health becomes negative. A nasty starts with 15 health and an arrow does 15 damage: the first hit leaves it alive at zero, and the second kills it. The player can similarly remain alive with an empty health bar. Whether this is a bug depends on whether zero was intended to mean dead."
        ]
      },
      {
        "title": "Nasties can share an initial position",
        "lines": "1380–1570 · PROC setupobj",
        "confidence": "Source-based finding; depends on random placement",
        "paragraphs": [
          "Placement accepts an empty map byte but stores the accepted address only in the object record. It does not reserve that cell before placing the next nasty. Two records can therefore accept the same location.",
          "The update routines clear their previous map byte and write their current one. Overlapping starts can conflict with that single-occupant representation and cause inconsistent visibility or occupancy."
        ]
      },
      {
        "title": "A fireball can follow a recycled target record",
        "lines": "10150; 6330–6400; 10800–10900",
        "confidence": "Source-based finding; not reproduced in full gameplay",
        "paragraphs": [
          "The fireball stores its target record address at +12 and repeatedly passes it to direction. If the target dies and its record is freed, a new projectile can reuse that record. The existing fireball can then follow the new contents rather than the original nasty.",
          "This is a stale target reference within the allocated object pool, rather than a pointer outside allocated memory."
        ]
      }
    ]
  },
  {
    "title": "Inefficiencies: optimisation opportunities",
    "items": [
      {
        "title": "Tile preparation copies twice the pixel data used",
        "lines": "4310–4320; 4600–4690 · buildblocks / drawmap",
        "confidence": "High confidence about the copy and read sizes",
        "paragraphs": [
          "buildblocks copies 64 bytes per available numbered sprite and uses a 64-byte stride. drawmap reads only eight words, or 32 bytes, for each 8 × 8 four-bit tile. The second copy is unused by this renderer and extends into following sprite-area contents.",
          "For the supplied assets, those extra reads remain within the allocated sprite area; this is not a demonstrated crash defect. A 32-byte stride could also save approximately 8 KiB."
        ]
      },
      {
        "title": "Fixed-pool scans repeat across several operations",
        "lines": "4790–5230; 10800–10900; 7130–7270",
        "confidence": "Optimisation opportunity; not profiled",
        "paragraphs": [
          "Every update visits all 256 records, including free slots. Allocation scans from the beginning, and collision handling searches records to recover the object represented by a map tile. Active-object lists, a free list or occupancy-to-record mapping could reduce this work, at the cost of more bookkeeping."
        ]
      },
      {
        "title": "The full map viewport is redrawn every update",
        "lines": "4380–4760 · drawmap",
        "confidence": "Deliberate trade-off may be reasonable; not profiled",
        "paragraphs": [
          "The renderer writes all 1,024 visible tiles, about 32 KiB, even when little has changed. Dirty-tile updates could reduce memory traffic. The existing direct framebuffer blitter is compact and efficient internally, however, so full redraw is a defensible design choice rather than inherently a bug."
        ]
      }
    ]
  },
  {
    "title": "Redundancies and unused code",
    "items": [
      {
        "title": "FN t has no identified call",
        "lines": "1630 · FN t",
        "confidence": "Unused in the supplied listing",
        "paragraphs": [
          "This map-occupancy helper is defined but has no identified call in the supplied program."
        ]
      },
      {
        "title": "PROC kk appears unused",
        "lines": "4010–4040 · PROC kk",
        "confidence": "Unused in the supplied listing",
        "paragraphs": [
          "The release-then-press keyboard wait is defined but appears to have no caller."
        ]
      },
      {
        "title": "PROC emptylevel has only a commented-out call",
        "lines": "2530–2590; 3430 · PROC emptylevel",
        "confidence": "Unused in the supplied execution path",
        "paragraphs": [
          "Its only identified reference is REM PROCemptylevel inside PROC startscreen. It is not executed in this copy."
        ]
      },
      {
        "title": "A loaded behaviour value is unused",
        "lines": "6090 · burningbody",
        "confidence": "Locally redundant load",
        "paragraphs": [
          "LDR R11,[R6,#20] reads a value that is not used before leaving this handler."
        ]
      },
      {
        "title": "The arrow map pointer is stored twice",
        "lines": "5820 and 5980 · arrow",
        "confidence": "Redundant on the surviving-arrow path",
        "paragraphs": [
          "The same map pointer is stored to the same record field twice on the surviving-arrow path. The later store appears redundant."
        ]
      }
    ]
  }
];
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 function render(){return `<div class="things-bugs"><h2>Discovered bugs</h2><p>A retrospective audit of the supplied Halls of the Things listing. Findings are grouped by consequence, with confidence and trigger conditions shown separately. The original program and emulator package remain unchanged.</p><p>The two serious failure paths were reproduced in reduced ARM tests. The logical findings are based on source inspection and small algorithm reproductions; a full gameplay stress test has not been performed. Line references below are original BBC BASIC line numbers.</p>${groups.map((g,i)=>`<section class="bug-category"><h3>${esc(g.title)}</h3>${g.items.map((b,j)=>`<article class="bug-finding"><div class="micro">${i+1}.${j+1} · ${esc(b.confidence)}</div><h4>${esc(b.title)}</h4><p class="bug-reference">${esc(b.lines)}</p>${b.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('')}</section>`).join('')}<section class="bug-category"><h3>Behaviour that may be deliberate</h3><p><code>milk</code> refuses a pickup if its entire bonus would take magic above 100 (lines 13760–13820). For example, 95 magic plus an eight-point pickup is rejected rather than clamped to 100. Preserving the item until more magic has been spent may have been intentional, so this is a design question rather than a confirmed bug.</p></section><p>The clearest priorities are the sword allocation failure, the collision-loop bound and the maze reset. Efficiency findings should be evaluated against the original machine before changing the design.</p><div class="actions"><a class="button secondary" href="#/programs/things/annotated">Read annotated source</a><a class="text-link" href="programs/things/HallsOfThe.txt" download>Download decoded listing</a></div></div>`}
 return {render};
})();
