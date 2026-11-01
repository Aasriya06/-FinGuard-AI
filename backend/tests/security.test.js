const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const app = require("../server");

describe("FinGuard AI - Security & CORS Policy", () => {
  let server;
  let port;

  // Start test server on random ephemeral port
  it("setup test server", (t, done) => {
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  it("should permit requests from approved localhost origins", (t, done) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
        },
      },
      (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(
          res.headers["access-control-allow-origin"],
          "http://localhost:5173"
        );
        res.resume();
        done();
      }
    );
    req.end();
  });

  it("should permit requests from approved Vercel production origin", (t, done) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
        headers: {
          Origin: "https://finguard-ai-orpin.vercel.app",
        },
      },
      (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(
          res.headers["access-control-allow-origin"],
          "https://finguard-ai-orpin.vercel.app"
        );
        res.resume();
        done();
      }
    );
    req.end();
  });

  it("should block unapproved third-party origins", (t, done) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
        headers: {
          Origin: "https://unauthorized-malicious-site.com",
        },
      },
      (res) => {
        // Express error handler returns 403 Forbidden for disallowed CORS
        assert.equal(res.statusCode, 403);
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const body = JSON.parse(data);
          assert.ok(body.message.includes("CORS"));
          done();
        });
      }
    );
    req.end();
  });

  it("teardown test server", (t, done) => {
    server.close(done);
  });
});
