// Run this file with `bun dev.ts`
// .env is automatically loaded by bun
import { $ } from "bun";

await Promise.all([$`bun tsup --watch`, $`./pocketbase serve`]);
