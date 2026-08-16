import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(".env.local", "utf8");
let url = "";
let serviceKey = "";

for (const line of env.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    url = trimmed.split("=")[1].replace(/^["']|["']$/g, "").trim();
  }
  if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceKey = trimmed.split("=")[1].replace(/^["']|["']$/g, "").trim();
  }
}

const supabase = createClient(url, serviceKey);

const { data: buckets, error } = await supabase.storage.listBuckets();
console.log("Buckets:", buckets);
if (error) console.error("Error:", error);

const hasMediaBucket = buckets?.some(b => b.name === "question-media");
if (!hasMediaBucket) {
  console.log("Creating question-media bucket...");
  const { data, error: createError } = await supabase.storage.createBucket("question-media", {
    public: false,
    fileSizeLimit: 10485760,
  });
  console.log("Created bucket result:", data, createError);
} else {
  console.log("Bucket 'question-media' already exists.");
}
