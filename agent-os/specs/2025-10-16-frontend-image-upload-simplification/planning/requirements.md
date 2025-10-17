# Frontend Image Upload Simplification

## Current Behavior

Right now, you upload an image by clicking on the image icon, which inserts a "dropzone" into the editor. You can either drag and drop onto the dropzone, or click it to select an image.

## Desired Behavior

### The user clicks on the image icon in the toolbar

If the user clicks the image icon, a dialog should open to choose an image. Selecting an image will insert it at the last location their cursor was in the editor (or place it at the bottom of the content if no previous location exists) and begin uploading it.

### The user drags an image into the editor

If the user drags an image into the editor, the image should begin uploading and be displayed in the editor. I'm unsure if TipTap (the editor) will choose the image's placement based on mouse position or not, you should look into that. If not, use the same rules as above.

## Simplify the code

This area of the codebase is overly complicated. A major goal should be to simplify rather than complicate more. If we could remove more code than we add, that would be awesome.
