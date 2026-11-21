# !Euclid 3D models

Original model files: Conservatory, Kitchen, Room, Mouse and 3DGlasses by Thomas Newcomb; Jonny (Jonathan’s bedroom) and MyRoom (David’s bedroom) by David Newcomb. The third-party Euclid application is not included.

Each model directory contains the unmodified original, derived `geometry.json`, and a reconstructed static preview. `models/euclid.js` declares collection metadata and implements the browser viewer. Add another model by adding its data directory and metadata entry; routes and navigation are shared.

Regenerate geometry with Python 3, NumPy and Shapely 2.1 or later:

    python tools/euclid-convert.py path/to/Model,de1 path/to/geometry.json

The converter is based on observed records in these seven files, not an authoritative Euclid format specification. It validates record extents and object references, follows the scene root stored in the file header (or the first object when that reference is zero), applies nested transforms (Z, Y, X rotation order), fills paths using the even-odd rule, preserves retraced linework, and reconstructs profile-joined surfaces. A model's editor camera is omitted from displayed geometry. After instancing, derived geometry reflects the Z coordinate and reverses triangle winding to convert source handedness for the browser. All source data remains in the original download.

Colours currently interpret the low colour byte as red. Unresolved appearance values use neutral grey. Material flags, joining/capping rules and lighting are provisional. No image textures are supplied or invented. The wall visibility control only changes the browser view.

MyRoom opens with enclosing walls hidden to show the interior. The wall control preserves horizontal floor surfaces. This changes only the viewer; the full geometry and unmodified original are retained.
