var http = require("http");
var fs = require("fs");
var path = require("path");

var PORT = parseInt(process.env.PORT, 10) || 7070;
var MAX_FILE_SIZE = 100 * 1024 * 1024;
var MAX_BODY_SIZE = 100 * 1024 * 1024;
var DATA_DIR = path.join(__dirname, "uploads");
var DATA_FILE = path.join(DATA_DIR, "attachments.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData() {
  try {
    var raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeData(items) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  if (payload === undefined) {
    res.end();
    return;
  }
  res.end(JSON.stringify(payload));
}

function handleGet(res) {
  var items = readData();
  sendJson(res, 200, items);
}

function handlePost(req, res) {
  var body = "";
  req.on("data", function (chunk) {
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      sendJson(res, 413, { error: "Payload too large." });
      req.destroy();
    }
  });

  req.on("end", function () {
    var payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch (error) {
      sendJson(res, 400, { error: "Invalid JSON payload." });
      return;
    }

    if (!payload || typeof payload.name !== "string" || !payload.dataUrl) {
      sendJson(res, 400, { error: "Missing file payload." });
      return;
    }

    if (payload.size > MAX_FILE_SIZE) {
      sendJson(res, 413, { error: "File exceeds size limit." });
      return;
    }

    var item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: payload.name,
      size: payload.size,
      type: payload.type || "",
      dataUrl: payload.dataUrl,
      addedAt: payload.addedAt || new Date().toISOString()
    };

    var items = readData();
    items.push(item);
    writeData(items);
    sendJson(res, 201, item);
  });
}

var server = http.createServer(function (req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  var urlPath = req.url ? req.url.split("?")[0] : "";
  if (urlPath !== "/api/attachments") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  if (req.method === "GET") {
    handleGet(res);
    return;
  }
  if (req.method === "POST") {
    handlePost(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, function () {
  console.log("Attachment server listening on http://localhost:" + PORT);
});
