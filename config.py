import os
import sys

if getattr(sys, "frozen", False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(APP_DIR, "escudo_mestre.db")
HOST = "127.0.0.1"
PORT = 8000

ALLOWED_TABLES = {
    "campaigns",
    "scenes",
    "scene_links",
    "scene_steps",
    "pois",
    "tests",
    "npcs",
    "items",
    "agents",
}
