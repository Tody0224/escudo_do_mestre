import json
from config import ALLOWED_TABLES
from database import get_db


def parse_record_route(path):
    parts = [p for p in path.split("/") if p]
    if len(parts) != 3 or parts[0] != "api":
        return None, None, ({"error": "Rota inválida"}, 400)

    table = parts[1]
    record_id = int(parts[2])
    if table not in ALLOWED_TABLES:
        return None, None, ({"error": "Tabela inválida"}, 400)

    return table, record_id, None


def handle_put(path, body):
    table, record_id, err = parse_record_route(path)
    if err:
        return err

    if not body:
        return {"ok": True}, 200

    if "skills_json" in body and isinstance(body["skills_json"], dict):
        body["skills_json"] = json.dumps(body["skills_json"], ensure_ascii=False)
    if "data_json" in body and isinstance(body["data_json"], dict):
        body["data_json"] = json.dumps(body["data_json"], ensure_ascii=False)

    fields = ", ".join(f"{k} = ?" for k in body.keys())
    values = list(body.values()) + [record_id]

    with get_db() as conn:
        conn.execute(f"UPDATE {table} SET {fields} WHERE id = ?", values)

    return {"ok": True}, 200


def handle_delete(path):
    table, record_id, err = parse_record_route(path)
    if err:
        return err

    with get_db() as conn:
        if table == "pois":
            conn.execute("DELETE FROM tests WHERE poi_id = ?", (record_id,))
            conn.execute("DELETE FROM items WHERE poi_id = ?", (record_id,))
        elif table == "scene_steps":
            poi_rows = conn.execute(
                "SELECT id FROM pois WHERE step_id = ?", (record_id,)
            ).fetchall()
            for pr in poi_rows:
                conn.execute("DELETE FROM tests WHERE poi_id = ?", (pr["id"],))
                conn.execute("DELETE FROM items WHERE poi_id = ?", (pr["id"],))
            conn.execute("DELETE FROM pois WHERE step_id = ?", (record_id,))
            conn.execute("DELETE FROM tests WHERE step_id = ?", (record_id,))

        conn.execute(f"DELETE FROM {table} WHERE id = ?", (record_id,))

    return {"ok": True}, 200
