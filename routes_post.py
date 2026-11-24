import json
from database import get_db


def handle_post(path, body):
    with get_db() as conn:
        if path == "/api/campaigns":
            cur = conn.execute(
                "INSERT INTO campaigns (name) VALUES (?)", (body["name"],)
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/scenes":
            pos_row = conn.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM scenes WHERE campaign_id = ?",
                (body["campaign_id"],),
            ).fetchone()
            idx = pos_row["next_pos"]
            default_x = 60 + (idx % 3) * 320
            default_y = 60 + (idx // 3) * 210
            cur = conn.execute(
                "INSERT INTO scenes (campaign_id, position, title, flow_x, flow_y) VALUES (?, ?, ?, ?, ?)",
                (
                    body["campaign_id"],
                    idx,
                    body["title"],
                    int(body.get("flow_x", default_x)),
                    int(body.get("flow_y", default_y)),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/scenes/reorder":
            for idx, sid in enumerate(body.get("scene_ids", [])):
                conn.execute("UPDATE scenes SET position = ? WHERE id = ?", (idx, sid))
            return {"ok": True}, 200

        if path == "/api/scene_links":
            cur = conn.execute(
                """INSERT INTO scene_links (campaign_id, from_scene_id, to_scene_id, label)
                   VALUES (?, ?, ?, ?)""",
                (
                    body["campaign_id"],
                    body["from_scene_id"],
                    body["to_scene_id"],
                    body.get("label", ""),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/scene_steps":
            pos_row = conn.execute(
                "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM scene_steps WHERE scene_id = ?",
                (body["scene_id"],),
            ).fetchone()
            cur = conn.execute(
                """INSERT INTO scene_steps (scene_id, position, title, narration, completed)
                   VALUES (?, ?, ?, ?, ?)""",
                (
                    body["scene_id"],
                    pos_row["next_pos"],
                    body["title"],
                    body.get("narration", ""),
                    int(body.get("completed", 0)),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/scene_steps/reorder":
            for idx, st_id in enumerate(body.get("step_ids", [])):
                conn.execute("UPDATE scene_steps SET position = ? WHERE id = ?", (idx, st_id))
            return {"ok": True}, 200

        if path == "/api/pois":
            cur = conn.execute(
                """INSERT INTO pois (
                    scene_id, step_id, poi_type, title, info, discovered
                ) VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    body["scene_id"],
                    body.get("step_id"),
                    body.get("poi_type", "Objeto"),
                    body["title"],
                    body.get("info", ""),
                    int(body.get("discovered", 0)),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/tests":
            cur = conn.execute(
                """INSERT INTO tests (
                    scene_id, step_id, poi_id, situation, action_description,
                    mechanic_key, mechanic_name, attribute, skill, dt,
                    mechanic_rules, success_outcome, failure_outcome
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    body["scene_id"],
                    body.get("step_id"),
                    body.get("poi_id"),
                    body["situation"],
                    body.get("action_description", ""),
                    body.get("mechanic_key", "padrao"),
                    body.get("mechanic_name", "Teste Padrão"),
                    body.get("attribute", ""),
                    body.get("skill", ""),
                    int(body.get("dt", 7)),
                    body.get("mechanic_rules", ""),
                    body.get("success_outcome", ""),
                    body.get("failure_outcome", ""),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/npcs":
            skills_raw = body.get("skills_json", "{}")
            if isinstance(skills_raw, dict):
                skills_raw = json.dumps(skills_raw, ensure_ascii=False)

            cur = conn.execute(
                """INSERT INTO npcs (
                    scene_id, name, role, element, location, description,
                    hp_current, hp_max, pd_current, pd_max, rd,
                    attr_fisico, attr_mente, attr_emocao,
                    skills_json, actions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    body["scene_id"],
                    body["name"],
                    body.get("role", "Inimigo"),
                    body.get("element", "Nenhum"),
                    body.get("location", ""),
                    body.get("description", ""),
                    int(body.get("hp_current", 10)),
                    int(body.get("hp_max", 10)),
                    int(body.get("pd_current", 10)),
                    int(body.get("pd_max", 10)),
                    int(body.get("rd", 0)),
                    int(body.get("attr_fisico", 6)),
                    int(body.get("attr_mente", 6)),
                    int(body.get("attr_emocao", 6)),
                    skills_raw,
                    body.get("actions", ""),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/items":
            cur = conn.execute(
                """INSERT INTO items (scene_id, poi_id, name, category, description, collected)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    body["scene_id"],
                    body.get("poi_id"),
                    body["name"],
                    body.get("category", "Pista / Documento"),
                    body.get("description", ""),
                    int(body.get("collected", 0)),
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/agents":
            data_raw = body.get("data_json", "{}")
            if isinstance(data_raw, dict):
                data_raw = json.dumps(data_raw, ensure_ascii=False)

            cur = conn.execute(
                """INSERT INTO agents (
                    campaign_id, name, accent_color, soft_color, portrait_data, data_json
                ) VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    body["campaign_id"],
                    body.get("name", "Nome do Agente"),
                    body.get("accent_color", "#db2777"),
                    body.get("soft_color", "#fdf2f8"),
                    body.get("portrait_data", ""),
                    data_raw,
                ),
            )
            return {"id": cur.lastrowid}, 201

        if path == "/api/campaigns/import":
            payload = body.get("campaign") if isinstance(body.get("campaign"), dict) else body
            if not isinstance(payload, dict) or not payload.get("name"):
                return {"error": "JSON de campanha inválido: campo 'name' é obrigatório."}, 400

            cur = conn.execute(
                "INSERT INTO campaigns (name, season_mechanics, general_notes) VALUES (?, ?, ?)",
                (
                    str(payload.get("name", "Campanha Importada")),
                    str(payload.get("season_mechanics", "")),
                    str(payload.get("general_notes", "")),
                ),
            )
            new_camp_id = cur.lastrowid

            # Import agents
            for ag in payload.get("agents", []):
                if not isinstance(ag, dict):
                    continue
                data_raw = ag.get("data_json", "{}")
                if isinstance(data_raw, dict):
                    data_raw = json.dumps(data_raw, ensure_ascii=False)
                conn.execute(
                    """INSERT INTO agents (
                        campaign_id, name, accent_color, soft_color, portrait_data, data_json
                    ) VALUES (?, ?, ?, ?, ?, ?)""",
                    (
                        new_camp_id,
                        str(ag.get("name", "Agente")),
                        str(ag.get("accent_color", "#db2777")),
                        str(ag.get("soft_color", "#fdf2f8")),
                        str(ag.get("portrait_data", "")),
                        data_raw,
                    ),
                )

            # Import scenes and remap IDs for links, steps, pois, tests, items, npcs
            scene_id_map = {}
            for idx, sc in enumerate(payload.get("scenes", [])):
                if not isinstance(sc, dict):
                    continue
                old_sc_id = sc.get("id")
                sc_cur = conn.execute(
                    """INSERT INTO scenes (
                        campaign_id, position, title, narration, gm_notes, flow_x, flow_y
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        new_camp_id,
                        int(sc.get("position", idx)),
                        str(sc.get("title", f"Cena {idx + 1}")),
                        str(sc.get("narration", "")),
                        str(sc.get("gm_notes", "")),
                        int(sc.get("flow_x", 60 + (idx % 3) * 320)),
                        int(sc.get("flow_y", 60 + (idx // 3) * 210)),
                    ),
                )
                new_sc_id = sc_cur.lastrowid
                if old_sc_id is not None:
                    scene_id_map[old_sc_id] = new_sc_id

                step_id_map = {}
                for s_idx, st in enumerate(sc.get("steps", [])):
                    if not isinstance(st, dict):
                        continue
                    old_st_id = st.get("id")
                    st_cur = conn.execute(
                        """INSERT INTO scene_steps (
                            scene_id, position, title, narration, gm_notes, completed
                        ) VALUES (?, ?, ?, ?, ?, ?)""",
                        (
                            new_sc_id,
                            int(st.get("position", s_idx)),
                            str(st.get("title", f"Etapa {s_idx + 1}")),
                            str(st.get("narration", "")),
                            str(st.get("gm_notes", "")),
                            int(st.get("completed", 0)),
                        ),
                    )
                    if old_st_id is not None:
                        step_id_map[old_st_id] = st_cur.lastrowid

                poi_id_map = {}
                for poi in sc.get("pois", []):
                    if not isinstance(poi, dict):
                        continue
                    old_poi_id = poi.get("id")
                    mapped_step_id = step_id_map.get(poi.get("step_id"))
                    if mapped_step_id is None and step_id_map:
                        mapped_step_id = next(iter(step_id_map.values()))
                    poi_cur = conn.execute(
                        """INSERT INTO pois (
                            scene_id, step_id, poi_type, title, skill, dt, info, discovered
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            new_sc_id,
                            mapped_step_id,
                            str(poi.get("poi_type", "Objeto")),
                            str(poi.get("title", "Ponto de Interesse")),
                            str(poi.get("skill", "")),
                            int(poi.get("dt", 7)),
                            str(poi.get("info", "")),
                            int(poi.get("discovered", 0)),
                        ),
                    )
                    new_poi_id = poi_cur.lastrowid
                    if old_poi_id is not None:
                        poi_id_map[old_poi_id] = new_poi_id

                    # Nested tests/items inside poi (if structured hierarchically)
                    for tst in poi.get("tests", []):
                        if not isinstance(tst, dict):
                            continue
                        conn.execute(
                            """INSERT INTO tests (
                                scene_id, step_id, poi_id, situation, action_description,
                                mechanic_key, mechanic_name, attribute, skill, dt,
                                mechanic_rules, success_outcome, failure_outcome
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (
                                new_sc_id,
                                mapped_step_id,
                                new_poi_id,
                                str(tst.get("situation", "Teste")),
                                str(tst.get("action_description", "")),
                                str(tst.get("mechanic_key", "padrao")),
                                str(tst.get("mechanic_name", "Teste Padrão")),
                                str(tst.get("attribute", "Mente")),
                                str(tst.get("skill", "Percepção")),
                                int(tst.get("dt", 7)),
                                str(tst.get("mechanic_rules", "")),
                                str(tst.get("success_outcome", "")),
                                str(tst.get("failure_outcome", "")),
                            ),
                        )

                    for itm in poi.get("items", []):
                        if not isinstance(itm, dict):
                            continue
                        conn.execute(
                            """INSERT INTO items (
                                scene_id, poi_id, name, category, description, collected
                            ) VALUES (?, ?, ?, ?, ?, ?)""",
                            (
                                new_sc_id,
                                new_poi_id,
                                str(itm.get("name", "Item / Pista")),
                                str(itm.get("category", "Pista / Documento")),
                                str(itm.get("description", "")),
                                int(itm.get("collected", 0)),
                            ),
                        )

                # Flat tests/items at scene level (for standard export format)
                for tst in sc.get("tests", []):
                    if not isinstance(tst, dict):
                        continue
                    mapped_step = step_id_map.get(tst.get("step_id"))
                    mapped_poi = poi_id_map.get(tst.get("poi_id"))
                    conn.execute(
                        """INSERT INTO tests (
                            scene_id, step_id, poi_id, situation, action_description,
                            mechanic_key, mechanic_name, attribute, skill, dt,
                            mechanic_rules, success_outcome, failure_outcome
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            new_sc_id,
                            mapped_step,
                            mapped_poi,
                            str(tst.get("situation", "Teste")),
                            str(tst.get("action_description", "")),
                            str(tst.get("mechanic_key", "padrao")),
                            str(tst.get("mechanic_name", "Teste Padrão")),
                            str(tst.get("attribute", "Mente")),
                            str(tst.get("skill", "Percepção")),
                            int(tst.get("dt", 7)),
                            str(tst.get("mechanic_rules", "")),
                            str(tst.get("success_outcome", "")),
                            str(tst.get("failure_outcome", "")),
                        ),
                    )

                for itm in sc.get("items", []):
                    if not isinstance(itm, dict):
                        continue
                    mapped_poi = poi_id_map.get(itm.get("poi_id"))
                    conn.execute(
                        """INSERT INTO items (
                            scene_id, poi_id, name, category, description, collected
                        ) VALUES (?, ?, ?, ?, ?, ?)""",
                        (
                            new_sc_id,
                            mapped_poi,
                            str(itm.get("name", "Item / Pista")),
                            str(itm.get("category", "Pista / Documento")),
                            str(itm.get("description", "")),
                            int(itm.get("collected", 0)),
                        ),
                    )

                for npc in sc.get("npcs", []):
                    if not isinstance(npc, dict):
                        continue
                    skills_raw = npc.get("skills_json", "{}")
                    if isinstance(skills_raw, dict):
                        skills_raw = json.dumps(skills_raw, ensure_ascii=False)
                    conn.execute(
                        """INSERT INTO npcs (
                            scene_id, name, role, element, location, description,
                            hp_current, hp_max, pd_current, pd_max, rd,
                            attr_fisico, attr_mente, attr_emocao,
                            skills_json, actions
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            new_sc_id,
                            str(npc.get("name", "NPC")),
                            str(npc.get("role", "Inimigo")),
                            str(npc.get("element", "Nenhum")),
                            str(npc.get("location", "")),
                            str(npc.get("description", "")),
                            int(npc.get("hp_current", npc.get("hp_max", 10))),
                            int(npc.get("hp_max", 10)),
                            int(npc.get("pd_current", npc.get("pd_max", 10))),
                            int(npc.get("pd_max", 10)),
                            int(npc.get("rd", 0)),
                            int(npc.get("attr_fisico", 6)),
                            int(npc.get("attr_mente", 6)),
                            int(npc.get("attr_emocao", 6)),
                            skills_raw,
                            str(npc.get("actions", "")),
                        ),
                    )

            # Import scene links
            for lnk in payload.get("scene_links", []):
                if not isinstance(lnk, dict):
                    continue
                new_from = scene_id_map.get(lnk.get("from_scene_id"))
                new_to = scene_id_map.get(lnk.get("to_scene_id"))
                if new_from and new_to:
                    conn.execute(
                        """INSERT INTO scene_links (campaign_id, from_scene_id, to_scene_id, label)
                           VALUES (?, ?, ?, ?)""",
                        (new_camp_id, new_from, new_to, str(lnk.get("label", ""))),
                    )

            return {"id": new_camp_id}, 201

        return {"error": "Rota não encontrada"}, 404
