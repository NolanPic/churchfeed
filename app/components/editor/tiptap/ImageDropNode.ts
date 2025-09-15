import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageDrop from "../ImageDrop";
import { Plugin } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { TextSelection } from "prosemirror-state";
import { enqueueDroppedFile } from "../uploadQueue";

export const ImageDropNode = Node.create<ImageDropOptions>({
  name: "imageDrop",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({ "data-id": attributes.id }),
      },
    };
  },

  addOptions() {
    return {
      accept: "image/*",
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
        ({ commands }) => {
          const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
          return commands.insertContent({ type: this.name, attrs: { id } });
        },
    } as const;
  },

  addProseMirrorPlugins() {
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
              if (files.length > 1) {
                // ignore multi-file drops for now
                e.preventDefault();
                return true;
              }
              const file = files[0];
              if (!file || !isAccepted(file.type, accept)) return false;

              e.preventDefault();

              const coords: { left: number; top: number } = {
                left: e.clientX,
                top: e.clientY,
              };
              const posAt = view.posAtCoords(coords);
              const insertAt = posAt ? posAt.pos : view.state.selection.from;

              // enqueue the file so the node view can pick it up
              enqueueDroppedFile(file);

              const { state } = view;
              const imageDropType = state.schema.nodes.imageDrop;
              if (!imageDropType) return false;

              let tr = state.tr;
              const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
              tr = tr.setSelection(TextSelection.create(tr.doc, insertAt));
              tr = tr.replaceSelectionWith(imageDropType.create({ id }), false);
              view.dispatch(tr);

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


