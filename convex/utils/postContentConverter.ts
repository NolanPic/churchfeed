import { renderToHTMLString } from '@tiptap/static-renderer'
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";

export function fromJSONToHTML(content: string) {

    // TODO: Remove when seeding script is updated
    // check if content is already HTML
    if(content.startsWith("<p>")) {
        return content;
    }

    let parsedContent;

    try {
        parsedContent = JSON.parse(content);
    } catch(error) {
        console.error("Failed to parse post content as JSON", error);
    }   

    let html = '';

    try {
        html = renderToHTMLString({
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
                Image,
            ],
            content: parsedContent,
        });
    } catch(error) {
        console.error("Failed to render post content to HTML", error);
    }

    return html;
}
