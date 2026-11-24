from database import get_db, rows_to_dicts


def fetch_all_data():
    with get_db() as conn:
        return {
            "campaigns": rows_to_dicts(
                conn.execute("SELECT * FROM campaigns ORDER BY id ASC").fetchall()
            ),
            "scenes": rows_to_dicts(
                conn.execute("SELECT * FROM scenes ORDER BY position ASC, id ASC").fetchall()
            ),
            "scene_links": rows_to_dicts(
                conn.execute("SELECT * FROM scene_links ORDER BY id ASC").fetchall()
            ),
            "scene_steps": rows_to_dicts(
                conn.execute("SELECT * FROM scene_steps ORDER BY position ASC, id ASC").fetchall()
            ),
            "pois": rows_to_dicts(
                conn.execute("SELECT * FROM pois ORDER BY id ASC").fetchall()
            ),
            "tests": rows_to_dicts(
                conn.execute("SELECT * FROM tests ORDER BY id ASC").fetchall()
            ),
            "npcs": rows_to_dicts(
                conn.execute("SELECT * FROM npcs ORDER BY id ASC").fetchall()
            ),
            "items": rows_to_dicts(
                conn.execute("SELECT * FROM items ORDER BY id ASC").fetchall()
            ),
            "agents": rows_to_dicts(
                conn.execute("SELECT * FROM agents ORDER BY id ASC").fetchall()
            ),
        }
