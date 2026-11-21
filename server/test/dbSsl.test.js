// TLS to the database (config.js dbSslFrom, DEPLOY 2.1). config.js stops the process on a bad value, so each case runs
// it in a child process. The live check (a verified connection to Aiven) is part of the deploy, not this suite.
import { spawnSync } from "node:child_process";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { describe, expect, it } from "vitest";
import config from "../config.js";

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// A real, public CA certificate that did NOT sign the test MySQL's certificate.
const UNRELATED_CA = tls.rootCertificates[0];

// What config.db.ssl comes out as with these variables, or how the start-up fails.
function sslConfigWith(vars) {
  const run = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", "const { default: c } = await import('./config.js'); console.log(JSON.stringify(c.db.ssl));"],
    { cwd: SERVER_DIR, env: { ...process.env, DB_SSL: "", DB_CA_CERT: "", ...vars }, encoding: "utf8" }
  );
  const lastLine = run.stdout.trim().split("\n").pop();
  return { status: run.status, ssl: run.status === 0 ? JSON.parse(lastLine) : undefined, stderr: run.stderr };
}

describe("DB_SSL settings", () => {
  it("unset or false -> no TLS (local MySQL)", () => {
    expect(sslConfigWith({}).ssl).toBeNull();
    expect(sslConfigWith({ DB_SSL: "false" }).ssl).toBeNull();
  });

  it("true with the CA -> TLS that always verifies the server's certificate", () => {
    const { status, ssl } = sslConfigWith({ DB_SSL: "true", DB_CA_CERT: UNRELATED_CA });
    expect(status).toBe(0);
    expect(ssl).toEqual({ ca: UNRELATED_CA.trim(), rejectUnauthorized: true });
  });

  it("a CA pasted on one line with \\n as two characters is turned back into a real certificate", () => {
    const oneLine = UNRELATED_CA.trim().replace(/\n/g, "\\n");
    expect(oneLine).not.toContain("\n");
    expect(sslConfigWith({ DB_SSL: "true", DB_CA_CERT: oneLine }).ssl.ca).toBe(UNRELATED_CA.trim());
  });

  it("true without a certificate -> TLS verified against the public authorities Node trusts (TiDB Cloud)", () => {
    const { status, ssl } = sslConfigWith({ DB_SSL: "true" });
    expect(status).toBe(0);
    expect(ssl).toEqual({ rejectUnauthorized: true }); // no ca: Node's root store, still verified
  });

  it("something that isn't a certificate pasted -> the server refuses to start, naming only the variable", () => {
    const { status, stderr } = sslConfigWith({ DB_SSL: "true", DB_CA_CERT: "not-a-certificate" });
    expect(status).toBe(1);
    expect(stderr).toMatch(/DB_CA_CERT must be the whole CA certificate/);
    expect(stderr).not.toContain("not-a-certificate"); // values are never printed
  });

  it("a value that isn't true/false -> refused (a typo must not silently mean 'no TLS')", () => {
    const { status, stderr } = sslConfigWith({ DB_SSL: "yes", DB_CA_CERT: UNRELATED_CA });
    expect(status).toBe(1);
    expect(stderr).toMatch(/DB_SSL must be true, false, or unset/);
  });
});

// These describe the local/CI MySQL: a self-signed certificate, and plain connections allowed. Against a hosted test
// database (DB_SSL=true, e.g. the TiDB compatibility run) neither is true, so they're skipped there.
describe.skipIf(config.db.ssl)("a TLS connection with the wrong CA", () => {
  const { host, port, user, password } = config.db;

  it("is refused: never a fallback to an unverified or plain connection", async () => {
    // The TLS handshake fails on the certificate (the test MySQL's own CA isn't the one given), not on anything else.
    await expect(
      mysql.createConnection({ host, port, user, password, ssl: { ca: UNRELATED_CA, rejectUnauthorized: true } })
    ).rejects.toMatchObject({ code: "HANDSHAKE_SSL_ERROR" });
  });

  it("with no CA given (public roots) a server whose certificate isn't publicly signed is refused too", async () => {
    // The test MySQL's certificate is self-signed: trusting "the public roots" must not mean "trust anything".
    await expect(
      mysql.createConnection({ host, port, user, password, ssl: { rejectUnauthorized: true } })
    ).rejects.toMatchObject({ code: "HANDSHAKE_SSL_ERROR" });
  });

  it("control: the same server without TLS connects, so the refusal above is the certificate check", async () => {
    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.end();
  });
});
