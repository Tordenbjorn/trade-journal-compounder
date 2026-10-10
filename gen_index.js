const fs = require("fs");
const m = JSON.parse(fs.readFileSync("site/manifest.json", "utf8"));
const V = m.whole.slice(0, 8);
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Trade journal compounder</title>
<style>
  html, body { margin: 0; padding: 0; background: #ECE9E2; }
  #root { min-height: 100vh; }
  #boot { font-family: Archivo, Helvetica, Arial, sans-serif; color: #5D6470; font-size: 13px; padding: 28px 16px; line-height: 1.5; }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js"></script>
<script src="https://unpkg.com/recharts@2.15.4/umd/Recharts.js"></script>
<script src="https://unpkg.com/@supabase/supabase-js@2.117.3/dist/umd/supabase.js"></script>
</head>
<body>
<div id="root"><div id="boot">Loading the tool...</div></div>
<script>
  window.__SUPABASE__ = { url: "https://mxwgunhezmmqhbyfzlbr.supabase.co", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d2d1bmhlem1tcWhieWZ6bGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0Nzc1NTIsImV4cCI6MjA1MTA1MzU1Mn0.B23JgnSG8ZkrwgdbxlQnNMWCbN6UHp-zVSX_KezSWBY" };
  (async function () {
    var boot = document.getElementById("boot");
    var V = "${V}";
    var parts = ${JSON.stringify(m.chunks.map(c => c.file))};
    var expectedParts = ${JSON.stringify(m.chunks.map(c => c.sha256))};
    var expectedWhole = "${m.whole}";
    function hex(buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
    async function sha(s) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
    function say(t) { if (boot) boot.textContent = t; }
    try {
      if (!window.React || !window.ReactDOM || !window.Recharts || !window.supabase) {
        say("The script libraries did not load (unpkg.com unreachable?). Check the connection and reload.");
        return;
      }
      var texts = await Promise.all(parts.map(async function (p) {
        var r = await fetch(p + "?v=" + V, { cache: "no-cache" });
        if (!r.ok) throw new Error("could not load " + p + " (" + r.status + ")");
        return r.text();
      }));
      var code = texts.join("");
      if ((await sha(code)) !== expectedWhole) {
        var bad = [];
        for (var i = 0; i < texts.length; i++) { if ((await sha(texts[i])) !== expectedParts[i]) bad.push(parts[i]); }
        say("Integrity check failed on the app code. Mismatched: " + (bad.length ? bad.join(", ") : "none individually, whole differs") + ". Not starting.");
        return;
      }
      new Function(code)();
    } catch (e) {
      say("Could not start the tool: " + (e && e.message ? e.message : e));
    }
  })();
</script>
</body>
</html>
`;
fs.writeFileSync("site/index.html", html);
fs.writeFileSync("site/placeholder.html", "<!doctype html><title>Trade journal compounder</title><p style=\"font-family:sans-serif;color:#5D6470;padding:24px\">Uploading the app bundle. The finished build replaces this page.</p>\n");
console.log("index bytes", Buffer.byteLength(html), "V", V);
