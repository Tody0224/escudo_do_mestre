import sqlite3
from config import DB_PATH


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def rows_to_dicts(rows):
    return [dict(r) for r in rows]


def ensure_column(conn, table, column, col_def):
    cols = [row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}")


def init_db():
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                season_mechanics TEXT DEFAULT '',
                general_notes TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS scenes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                position INTEGER NOT NULL DEFAULT 0,
                title TEXT NOT NULL,
                narration TEXT DEFAULT '',
                gm_notes TEXT DEFAULT '',
                flow_x INTEGER DEFAULT 0,
                flow_y INTEGER DEFAULT 0,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS scene_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                from_scene_id INTEGER NOT NULL,
                to_scene_id INTEGER NOT NULL,
                label TEXT DEFAULT '',
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (from_scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
                FOREIGN KEY (to_scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS scene_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id INTEGER NOT NULL,
                position INTEGER NOT NULL DEFAULT 0,
                title TEXT NOT NULL,
                narration TEXT DEFAULT '',
                gm_notes TEXT DEFAULT '',
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS pois (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id INTEGER NOT NULL,
                step_id INTEGER DEFAULT NULL,
                poi_type TEXT DEFAULT 'Objeto',
                title TEXT NOT NULL,
                skill TEXT DEFAULT '',
                dt INTEGER DEFAULT 7,
                info TEXT DEFAULT '',
                discovered INTEGER DEFAULT 0,
                FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id INTEGER NOT NULL,
                step_id INTEGER DEFAULT NULL,
                poi_id INTEGER DEFAULT NULL,
                situation TEXT NOT NULL,
                action_description TEXT DEFAULT '',
                mechanic_key TEXT NOT NULL,
                mechanic_name TEXT NOT NULL,
                attribute TEXT DEFAULT '',
                skill TEXT DEFAULT '',
                dt INTEGER DEFAULT 7,
                mechanic_rules TEXT DEFAULT '',
                success_outcome TEXT DEFAULT '',
                failure_outcome TEXT DEFAULT '',
                FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS npcs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'Inimigo',
                element TEXT DEFAULT 'Nenhum',
                location TEXT DEFAULT '',
                description TEXT DEFAULT '',
                hp_current INTEGER DEFAULT 10,
                hp_max INTEGER DEFAULT 10,
                pd_current INTEGER DEFAULT 10,
                pd_max INTEGER DEFAULT 10,
                rd INTEGER DEFAULT 0,
                attr_fisico INTEGER DEFAULT 6,
                attr_mente INTEGER DEFAULT 6,
                attr_emocao INTEGER DEFAULT 6,
                skills_json TEXT DEFAULT '{}',
                stats TEXT DEFAULT '',
                actions TEXT DEFAULT '',
                FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id INTEGER NOT NULL,
                poi_id INTEGER DEFAULT NULL,
                name TEXT NOT NULL,
                category TEXT DEFAULT 'Pista / Documento',
                description TEXT DEFAULT '',
                collected INTEGER DEFAULT 0,
                FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                name TEXT NOT NULL DEFAULT 'Nome do Agente',
                accent_color TEXT DEFAULT '#db2777',
                soft_color TEXT DEFAULT '#fdf2f8',
                portrait_data TEXT DEFAULT '',
                data_json TEXT DEFAULT '{}',
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
            );
            """
        )
        ensure_column(conn, "campaigns", "season_mechanics", "TEXT DEFAULT ''")
        ensure_column(conn, "campaigns", "general_notes", "TEXT DEFAULT ''")
        ensure_column(conn, "scenes", "flow_x", "INTEGER DEFAULT 0")
        ensure_column(conn, "scenes", "flow_y", "INTEGER DEFAULT 0")
        ensure_column(conn, "pois", "step_id", "INTEGER DEFAULT NULL")
        ensure_column(conn, "pois", "poi_type", "TEXT DEFAULT 'Objeto'")
        ensure_column(conn, "tests", "step_id", "INTEGER DEFAULT NULL")
        ensure_column(conn, "tests", "poi_id", "INTEGER DEFAULT NULL")
        ensure_column(conn, "tests", "action_description", "TEXT DEFAULT ''")
        ensure_column(conn, "items", "poi_id", "INTEGER DEFAULT NULL")
        ensure_column(conn, "npcs", "element", "TEXT DEFAULT 'Nenhum'")
        ensure_column(conn, "npcs", "location", "TEXT DEFAULT ''")
        ensure_column(conn, "npcs", "description", "TEXT DEFAULT ''")
        ensure_column(conn, "npcs", "attr_fisico", "INTEGER DEFAULT 6")
        ensure_column(conn, "npcs", "attr_mente", "INTEGER DEFAULT 6")
        ensure_column(conn, "npcs", "attr_emocao", "INTEGER DEFAULT 6")
        ensure_column(conn, "npcs", "skills_json", "TEXT DEFAULT '{}'")
