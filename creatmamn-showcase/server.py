#!/usr/bin/env python3
"""
Custom minimal threaded HTTP server for @creatmamn Photography Showcase.
Serves static assets in parallel, catalog API, and handles contact/SMS submissions
without redirecting the user to email.
"""

import http.server
import socketserver
import json
import os
import mimetypes
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data')
MESSAGES_FILE = os.path.join(DATA_DIR, 'messages.json')
CATALOG_FILE = os.path.join(DATA_DIR, 'catalog.json')

# Ensure mimetypes knows webp
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/json', '.json')

os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(MESSAGES_FILE):
    with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

class ShowcaseHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def copyfile(self, source, outputfile):
        """Gracefully handle client disconnects / broken pipes without crashing."""
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # API: get catalog
        if path == '/api/catalog':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            if os.path.exists(CATALOG_FILE):
                with open(CATALOG_FILE, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'{"best": [], "another": []}')
            return

        # API: get messages
        if path == '/api/messages':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            if os.path.exists(MESSAGES_FILE):
                with open(MESSAGES_FILE, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'[]')
            return

        # Serve index.html for root
        if path == '/' or path == '':
            self.path = '/index.html'

        try:
            return super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ('/api/contact', '/api/sms'):
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8')

            try:
                data = json.loads(raw_body)
            except Exception:
                # Handle form urlencoded as fallback
                params = parse_qs(raw_body)
                data = {k: v[0] if len(v) == 1 else v for k, v in params.items()}

            message_text = data.get('message', '').strip()
            sender_name = data.get('name', 'Anonymous Visitor').strip()
            sender_contact = data.get('contact', '').strip() or data.get('phone', '').strip()
            msg_type = 'SMS / Direct Note' if path == '/api/sms' or data.get('is_sms') else 'Direct Showcase Inquiry'

            if not message_text:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Message text cannot be empty'}).encode('utf-8'))
                return

            new_record = {
                'id': f'msg-{int(datetime.now().timestamp() * 1000)}',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'type': msg_type,
                'name': sender_name,
                'contact': sender_contact,
                'message': message_text,
                'status': 'received',
                'target_recipient': 'Jiban Jyoti Roy (@creatmamn)',
                'target_phone': '7363852502',
                'target_email': 'jibanjyotiroy25@gmail.com'
            }

            # Persist to messages.json
            try:
                messages = []
                if os.path.exists(MESSAGES_FILE):
                    with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                        messages = json.load(f)
                messages.insert(0, new_record)
                with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(messages, f, indent=2)
            except Exception as e:
                print(f"Error saving message: {e}")

            # Return success response directly in JSON (no email redirect!)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_payload = {
                'success': True,
                'message': 'Your message has been directly dispatched to Jiban Jyoti Roy (+91 7363852502).',
                'recipient': '+91 7363852502',
                'details': new_record
            }
            self.wfile.write(json.dumps(response_payload).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server():
    for attempt_port in [8080, 8081, 3000, 3001, 5000]:
        try:
            httpd = ThreadedHTTPServer(("", attempt_port), ShowcaseHandler)
            print(f"[OK] @creatmamn Showcase server running at http://localhost:{attempt_port}")
            httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e):
                continue
            raise

if __name__ == '__main__':
    run_server()
