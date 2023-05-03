#!/usr/bin/env node

import { build } from "./build";
import { createServer } from "./server";

build().then(() => createServer());
