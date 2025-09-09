import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageDrop from "../ImageDrop";
import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { TextSelection } from "prosemirror-state";

export const ImageDropNode = Node.create<ImageDropOptions>({
  name: "imageDrop",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      accept: "image/*",
      upload: async () => {
        throw new Error("No upload handler provided");
      },
      onError: undefined,
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-image-drop]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-image-drop": "" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageDrop);
  },

  addCommands() {
    return {
      setImageDrop:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    } as const;
  },

  addProseMirrorPlugins() {
    const upload = this.options.upload;
    const accept = this.options.accept;

    const isAccepted = (mimeType: string, acceptList?: string): boolean => {
      if (!acceptList) return true;
      const patterns = acceptList
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (patterns.length === 0) return true;
      return patterns.some((pattern) => {
        if (pattern.endsWith("/*")) {
          const prefix = pattern.slice(0, -1); // keep trailing '/'
          return mimeType.startsWith(prefix);
        }
        return mimeType === pattern;
      });
    };
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            drop: (view: EditorView, event: Event) => {
              const e = event as DragEvent;
              const files = e.dataTransfer?.files;
              if (!files || files.length === 0) return false;
              const file = files[0];
              if (!file || !isAccepted(file.type, accept)) return false;

              e.preventDefault();

              const coords: { left: number; top: number } = {
                left: e.clientX,
                top: e.clientY,
              };
              const posAt = view.posAtCoords(coords);
              const insertAt = posAt ? posAt.pos : view.state.selection.from;
              const placeholder = "Uploading image...";

              view.dispatch(view.state.tr.insertText(placeholder, insertAt));

              const start = insertAt;
              const end = insertAt + placeholder.length;

              upload(file)
                .then((url) => {
                  const { state } = view;
                  let tr = state.tr.delete(start, end);
                  
                  tr = tr.setSelection(TextSelection.create(tr.doc, start));
                  
                  const imageType = state.schema.nodes.image;
                  const node = imageType.create({ src: url });
                  
                  tr = tr.replaceSelectionWith(node, false);
                  view.dispatch(tr);
                })
                .catch((error) => {
                  const { state } = view;
                  const tr = state.tr.insertText("Upload failed", start, end);
                  view.dispatch(tr);
                  if (this.options.onError) {
                    this.options.onError(error);
                  }
                });

              return true;
            },
          },
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageDrop: {
      setImageDrop: () => ReturnType;
    };
  }
}


