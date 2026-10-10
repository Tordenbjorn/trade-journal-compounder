const fs = require("fs"), crypto = require("crypto"), path = require("path");
const src = fs.readFileSync("app-ll.js", "utf8");
if (!src.endsWith("\n")) throw new Error("source must end with newline");
const lines = src.split("\n"); lines.pop(); // trailing empty
const LIMIT = 34000;
const chunks = []; let cur = "";
for (const l of lines) {
  const piece = l + "\n";
  if (cur.length && (cur.length + piece.length) > LIMIT) { chunks.push(cur); cur = ""; }
  cur += piece;
}
if (cur) chunks.push(cur);
const manifest = [];
chunks.forEach((c, i) => {
  const name = "c" + String(i + 1).padStart(2, "0") + ".txt";
  fs.writeFileSync(path.join("site/chunks", name), c);
  manifest.push({ file: "chunks/" + name, bytes: Buffer.byteLength(c), lines: c.split("\n").length - 1,
    sha1: crypto.createHash("sha1").update(c).digest("hex"), sha256: crypto.createHash("sha256").update(c).digest("hex") });
});
const whole = crypto.createHash("sha256").update(chunks.join("")).digest("hex");
if (chunks.join("") !== src) throw new Error("reassembly mismatch");
fs.writeFileSync("site/manifest.json", JSON.stringify({ whole, build: new Date().toISOString().slice(0, 10), chunks: manifest }, null, 2));
console.log(JSON.stringify({ whole, chunks: manifest }, null, 1));
