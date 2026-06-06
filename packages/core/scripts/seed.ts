// Seed the RAG knowledge base from data/knowledge.seed.json.
// Run from repo root once Supabase + env are set:  npm run seed -w @studio/core
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rag } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "../../../data/knowledge.seed.json");

const chunks = JSON.parse(await readFile(file, "utf8"));
console.log(`Seeding ${chunks.length} verified knowledge chunks...`);
await rag.ingestMany(chunks);
console.log("Done. Knowledge base is grounded.");
