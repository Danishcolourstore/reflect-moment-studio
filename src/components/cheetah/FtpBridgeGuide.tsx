import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Server, Terminal, AlertTriangle } from 'lucide-react';

interface Props {
  credentials: {
    sessionId: string;
    uploadToken: string;
    httpEndpoint: string;
  };
}

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-muted/30 rounded-lg p-3 relative group">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      <pre className="text-[10px] text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
        {content}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1 rounded bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

const BRIDGE_SCRIPT = (endpoint: string, sessionId: string, token: string) => `#!/usr/bin/env python3
"""
Mirror AI — FTP-to-HTTP Bridge
Run this on any machine (laptop, Raspberry Pi, VPS).
Your camera connects via FTP → this script forwards to Mirror AI.

Requirements: pip install pyftpdlib requests
"""
import os, sys, time, requests
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from pyftpdlib.authorizers import DummyAuthorizer

# ── Config ──
MIRROR_ENDPOINT = "${endpoint}"
SESSION_ID      = "${sessionId}"
UPLOAD_TOKEN    = "${token}"
FTP_USER        = "camera"
FTP_PASS        = "mirror2024"
FTP_PORT        = 2121
UPLOAD_DIR      = "./camera_uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

class MirrorHandler(FTPHandler):
    def on_file_received(self, file_path):
        """Called when camera finishes uploading a file via FTP."""
        print(f"📷 Received: {os.path.basename(file_path)}")
        try:
            with open(file_path, "rb") as f:
                resp = requests.post(
                    MIRROR_ENDPOINT,
                    headers={
                        "x-session-id": SESSION_ID,
                        "x-upload-token": UPLOAD_TOKEN,
                    },
                    files={"file": (os.path.basename(file_path), f)},
                    timeout=30,
                )
            if resp.ok:
                print(f"  ✅ Sent to Mirror AI → {resp.json().get('photo_id', '?')}")
                os.remove(file_path)  # Clean up
            else:
                print(f"  ❌ Upload failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

authorizer = DummyAuthorizer()
authorizer.add_user(FTP_USER, FTP_PASS, UPLOAD_DIR, perm="elradfmw")

handler = MirrorHandler
handler.authorizer = authorizer
handler.passive_ports = range(60000, 60100)

server = FTPServer(("0.0.0.0", FTP_PORT), handler)
print(f"""
╔══════════════════════════════════════════╗
║  Mirror AI — FTP Bridge Running          ║
║                                          ║
║  FTP Host: <your-ip>:{FTP_PORT}             ║
║  Username: {FTP_USER}                         ║
║  Password: {FTP_PASS}                   ║
║                                          ║
║  Enter these in your camera's FTP setup  ║
╚══════════════════════════════════════════╝
""")
server.serve_forever()
`;

const DOCKER_COMPOSE = (endpoint: string, sessionId: string, token: string) => `version: "3.8"
services:
  ftp-bridge:
    image: python:3.11-slim
    command: >
      bash -c "pip install pyftpdlib requests &&
               python /app/bridge.py"
    ports:
      - "2121:2121"
      - "60000-60100:60000-60100"
    volumes:
      - ./bridge.py:/app/bridge.py
    environment:
      MIRROR_ENDPOINT: "${endpoint}"
      SESSION_ID: "${sessionId}"
      UPLOAD_TOKEN: "${token}"
`;

export default function FtpBridgeGuide({ credentials }: Props) {
  const script = BRIDGE_SCRIPT(credentials.httpEndpoint, credentials.sessionId, credentials.uploadToken);
  const docker = DOCKER_COMPOSE(credentials.httpEndpoint, credentials.sessionId, credentials.uploadToken);

  return (
    <div className="space-y-5">
      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">How the FTP Bridge Works</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Run bridge', desc: 'Start the Python script on your laptop or server' },
            { step: '2', title: 'Camera → FTP', desc: 'Camera uploads photos to the bridge via FTP' },
            { step: '3', title: 'Bridge → Mirror', desc: 'Script auto-forwards each photo to Mirror AI' },
            { step: '4', title: 'Live in UI', desc: 'Photos appear instantly in the Live Feed tab' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{s.step}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python bridge script */}
      <CopyBlock label="Python FTP Bridge — save as bridge.py" content={script} />

      {/* Quick start */}
      <CopyBlock
        label="Quick Start"
        content={`# Install dependencies
pip install pyftpdlib requests

# Run the bridge
python bridge.py

# Then in your camera's FTP settings:
#   Host: your-laptop-ip
#   Port: 2121
#   User: camera
#   Pass: mirror2024`}
      />

      {/* Docker */}
      <CopyBlock label="Docker Compose (optional)" content={docker} />

      {/* Camera setup guides */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Camera FTP Setup</h4>
        <div className="space-y-2 text-[10px] text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-[8px] shrink-0 mt-0.5">Canon</Badge>
            <span>Menu → WiFi → FTP Transfer → Server: your-ip, Port: 2121, User: camera, Pass: mirror2024</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-[8px] shrink-0 mt-0.5">Sony</Badge>
            <span>Menu → Network → FTP Transfer → Register Server → enter bridge credentials above</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-[8px] shrink-0 mt-0.5">Nikon</Badge>
            <span>Menu → Connect to Other Devices → FTP Upload → enter bridge credentials above</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 pt-1">
        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          The bridge must run on the same network as your camera. For remote shoots, use the Docker option on a VPS with a public IP.
        </span>
      </div>
    </div>
  );
}
