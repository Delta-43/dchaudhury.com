#!/usr/bin/env python3
"""Send this server's status to dchaudhury.com/homelab.

Reads which Docker containers are running, reduces that to the services listed
in the config file, signs the result with the server's Ed25519 key, and posts
it to the site. Container names never leave the server: the report holds only
service ids (from src/data/homelab.json), true or false, and a count.

Usage: homelab-report.py [--config PATH] [--dry-run]

Config (JSON, default ~/.config/homelab-status/config.json):
    {
      "server": "home",
      "endpoint": "https://dchaudhury.com/api/homelab/report",
      "key": "~/.config/homelab-status/key.pem",
      "services": { "git": ["git-server"], "automation": ["workflows"] }
    }

A service counts as up only when all of its containers are running.
Create a key with:  openssl genpkey -algorithm ed25519 -out key.pem
Public key for the catalogue:
    openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request


def running_containers() -> set[str]:
    result = subprocess.run(
        ["docker", "ps", "--format", "{{.Names}}"],
        capture_output=True,
        text=True,
        check=True,
    )
    return set(result.stdout.split())


def sign(key_path: str, message: bytes) -> str:
    # Ed25519 signs in one shot, so OpenSSL needs the message as a file, not stdin.
    with tempfile.NamedTemporaryFile() as file:
        file.write(message)
        file.flush()
        result = subprocess.run(
            ["openssl", "pkeyutl", "-sign", "-inkey", key_path, "-rawin", "-in", file.name],
            capture_output=True,
            check=True,
        )
    return result.stdout.hex()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--config", default="~/.config/homelab-status/config.json")
    parser.add_argument("--dry-run", action="store_true", help="print the report instead of sending it")
    args = parser.parse_args()

    with open(os.path.expanduser(args.config), encoding="utf-8") as file:
        config = json.load(file)

    running = running_containers()
    services = {
        service: all(name in running for name in names)
        for service, names in config["services"].items()
    }
    body = json.dumps(
        {"server": config["server"], "running": len(running), "services": services},
        separators=(",", ":"),
    )

    if args.dry_run:
        print(body)
        return 0

    timestamp = str(int(time.time() * 1000))
    signature = sign(os.path.expanduser(config["key"]), f"{timestamp}.{body}".encode())
    request = urllib.request.Request(
        config["endpoint"],
        data=body.encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "homelab-report/1",
            "X-Homelab-Timestamp": timestamp,
            "X-Homelab-Signature": signature,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return 0 if response.status in (200, 204) else 1
    except urllib.error.HTTPError as error:
        print(f"homelab-report: {error.code} {error.read().decode(errors='replace')}", file=sys.stderr)
        return 1
    except urllib.error.URLError as error:
        print(f"homelab-report: {error.reason}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
