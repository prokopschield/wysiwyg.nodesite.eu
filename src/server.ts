import { create } from "nodesite.eu";

import { name } from "./constants";
import { listener } from "./listener";

export const createServer = (
    domain = name,
    root = "/",
    callback = listener,
    html = "./lib/public"
) => create(domain, root, callback, html);
