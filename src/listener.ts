import * as base64 from "@prokopschield/base64";
import { Listener } from "nodesite.eu";
import { Source } from "nsblob-stream";

import { base_url } from "./constants";

export const listener: Listener = async (request) => {
    const { pathname } = new URL(request.uri, base_url);

    let [hash] = pathname.match(/([A-Z0-0~_]{43})|([a-f0-9]{64})/gi) || [];

    if (hash) {
        if (hash.length < 64) {
            hash = Buffer.from(base64.decode(hash)).toString("hex");
        }

        if (pathname.includes("download")) {
            const source = await Source.fromHash(hash);

            return {
                statusCode: 200,
                head: {
                    "Content-Type": source.props.type,
                    "Content-Length": source.length,
                },
                stream: source.raw,
            };
        } else {
            return {
                statusCode: 302,
                head: {
                    Location: `/editor.html?document=/download/${hash}.md`,
                },
            };
        }
    } else {
        return {
            statusCode: 302,
            head: {
                Location: `/editor.html?document=/homepage.md`,
            },
        };
    }
};
