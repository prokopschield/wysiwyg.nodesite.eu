import Buffer from "fix-buffer-in-browser";
import { Source } from "nsblob-stream";
import { Converter } from "showdown";

const { searchParams } = new URL(location.href);

async function init() {
    const response = await fetch(
        searchParams.get("document") || "/homepage.md"
    );
    const markdown = await response.text();
    const showdown = new Converter({
        completeHTMLDocument: true,
        customizedHeaderId: true,
        ellipsis: true,
        emoji: true,
        encodeEmails: true,
        ghCodeBlocks: true,
        ghCompatibleHeaderId: true,
        ghMentions: true,
        noHeaderId: true,
        omitExtraWLInCodeBlocks: true,
        openLinksInNewWindow: true,
        parseImgDimensions: true,
        requireSpaceBeforeHeadingText: false,
        simpleLineBreaks: true,
        simplifiedAutoLink: true,
        smartIndentationFix: true,
        smoothLivePreview: true,
        splitAdjacentBlockquotes: true,
        strikethrough: true,
        tables: true,
        tasklists: true,
        underline: true,
    });

    const html = showdown.makeHtml(markdown);

    const body = document.querySelector("body");

    if (!body) {
        throw new Error("Body not found.");
    }

    body.innerHTML = html;

    const transformNode = (element: Element): string => {
        return [...element.childNodes]
            .map((element) => {
                if (element.nodeValue) {
                    return element.nodeValue
                        .replace(/^\n+/g, "")
                        .replace(/\n+$/g, "");
                } else if (element instanceof Element) {
                    const contents = transformNode(element);

                    switch (element.localName) {
                        case "a":
                            const anchor = element as HTMLAnchorElement;

                            if (contents.includes("<")) {
                                return anchor.outerHTML;
                            } else if (contents) {
                                return `[${contents}](${anchor.href})`;
                            } else {
                                return "";
                            }
                        case "b":
                        case "strong":
                            return contents ? `**${contents}**` : "";
                        case "i":
                        case "em":
                            return contents ? `*${contents}*` : "";
                        case "blockquote":
                            return (
                                contents
                                    .trim()
                                    .split(/\n/)
                                    .map((line) => `> ${line}`)
                                    .join("\n") + "\n"
                            );
                        case "br":
                            return "\n";
                        case "code":
                            if (contents.includes("\n")) {
                                return "\n```\n" + contents.trim() + "\n```\n";
                            } else {
                                return "<code>" + contents + "</code>";
                            }
                        case "div":
                            return `\n${contents.trim()}\n`;
                        case "font":
                            return contents;
                        case "hr":
                            return `<hr/>`;
                        case "iframe":
                            return element.outerHTML;
                        case "img":
                            const img_element = element as HTMLImageElement;

                            return `![${img_element.alt}](${img_element.src})`;
                        case "meta":
                            return "";
                        case "p":
                            return `\n${contents.trim()}\n`;
                        case "pre":
                            return contents;
                        case "span":
                            return contents;
                        case "textarea":
                            return (
                                (element as HTMLTextAreaElement)?.value ||
                                contents
                            );
                        case "u":
                            return `<u>${contents.replace(/_/g, "\\_")}</u>`;

                        default:
                            if (element.localName.match(/^h[\d]+$/g)) {
                                return `\n${"#".repeat(
                                    Number(element.localName.slice(1))
                                )} ${contents.trim()}\n`;
                            }

                            return `<${element.localName}>${contents}</${element.localName}>`;
                    }
                } else {
                    throw new Error("");
                }
            })
            .join("")
            .replace(/\n\n+/g, "\n\n");
    };

    const getMarkdown = () => {
        return transformNode(body).replace(/^\n+/g, "").replace(/\n+$/g, "\n");
    };

    const getMarkdownHash = async () => {
        const markdown = getMarkdown();

        const source = await Source.fromBuffer(Buffer.from(markdown), {
            type: "text/markdown; charset=utf-8",
        });

        return source.hash;
    };

    body.addEventListener("keydown", async (event) => {
        if (event.ctrlKey) {
            switch (event.key.toLowerCase()) {
                case "a": {
                    event.preventDefault();

                    body.innerHTML = showdown.makeHtml(getMarkdown());

                    return;
                }

                case "d": {
                    event.preventDefault();

                    const url = new URL(
                        `/download/${await getMarkdownHash()}.md`,
                        location.href
                    );

                    prompt("Download URL:", url.href);

                    return;
                }

                case "h": {
                    event.preventDefault();

                    const html = [
                        "<!DOCTYPE html>",
                        "<html>",
                        '<link rel="stylesheet" href="https://l.og.ax/p0jxr6r">',
                        "</head>",
                        "<body>",
                        body.innerHTML.trim(),
                        "</body>",
                        "</html>",
                        "",
                    ].join("\n");

                    const buffer = Buffer.from(html);

                    const source = await Source.fromBuffer(buffer, {
                        type: "text/html; charset=utf-8",
                    });

                    const url = new URL(
                        `/download/${source.hash}.html`,
                        location.href
                    );

                    prompt("Download link:", url.href);

                    return;
                }

                case "l": {
                    event.preventDefault();

                    console.log(getMarkdown());

                    return;
                }

                case "m": {
                    event.preventDefault();

                    body.innerHTML = `<textarea style="height:${innerHeight}px;width:${innerWidth}px;">${getMarkdown()}</textarea>`;

                    return;
                }

                case "s": {
                    event.preventDefault();

                    const markdown = await getMarkdownHash();

                    history.pushState(
                        undefined,
                        "",
                        `/editor.html?document=/download/${markdown}.md`
                    );

                    return;
                }

                case "u": {
                    event.preventDefault();

                    const file_input = document.createElement("input");

                    file_input.type = "file";

                    file_input.addEventListener("change", async () => {
                        for (const file of file_input.files || []) {
                            const { hash } = await Source.fromBuffer(
                                Buffer.from(await file.arrayBuffer()),
                                {
                                    lastModified: String(file.lastModified),
                                    name: file.name,
                                    size: String(file.size),
                                    type: file.type,
                                    webkitRelativePath: file.webkitRelativePath,
                                }
                            );

                            location.href = `/editor.html?document=/download/${hash}.md`;
                        }
                    });

                    file_input.click();

                    return;
                }
            }
        }
    });
}

init();
