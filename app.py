from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8000
ROOT_DIR = Path(__file__).resolve().parent


class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def translate_path(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        return super().translate_path(path)


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), CustomHandler)
    print(f"Portfolio is running on http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
