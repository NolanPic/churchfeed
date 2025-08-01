import { renderToHTMLString } from '@tiptap/static-renderer'
import StarterKit from "@tiptap/starter-kit";

export function fromJSONToHTML(content: string) {

    // TODO: Remove when seeding script is updated
    // check if content is already HTML
    if(content.startsWith("<p>")) {
        return content;
    }

    const html = renderToHTMLString({
        extensions: [
            StarterKit.configure({
                bulletList: false,
                code: false,
                codeBlock: false,
                heading: false,
                horizontalRule: false,
                strike: false,
                underline: false,
            }),
        ],
        content: JSON.parse(content),
    });

    return html;
}
