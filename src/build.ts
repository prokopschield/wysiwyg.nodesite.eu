import createBrowserify from "browserify";
import { create } from "nodesite.eu";
import { Source } from "nsblob-stream";
import { minify } from "terser";

import { name } from "./constants";

const SCRIPT_FILE = "./lib/public/script.js";

export async function build() {
    const browserify = createBrowserify();

    browserify.add(SCRIPT_FILE);

    const browserifyStream = browserify.bundle();

    const bundle_chunks = Array<Buffer>();

    browserifyStream.on("data", (chunk) => bundle_chunks.push(chunk));

    await new Promise((resolve) => browserifyStream.on("end", resolve));

    const bundle_buffer = Buffer.concat(bundle_chunks);

    Source.fromBuffer(bundle_buffer, { type: "application/javascript" }).then(
        (source) => create(name, "/bundle.js", () => source)
    );

    const { code } = await minify({
        "bundle.js": String(bundle_buffer),
    });

    await Source.fromBuffer(Buffer.from(String(code)), {
        type: "application/javascript",
    }).then((source) => create(name, "/script.min.js", () => source));
}
