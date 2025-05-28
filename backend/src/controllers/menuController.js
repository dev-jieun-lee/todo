const { dbAll } = require("../utils/dbHelpers");
const { logSystemAction } = require("../utils/handleError");
const { LOG_ACTIONS } = require("../utils/logActions");
const { getAllMenus } = require("../models/menuModel");
// 메뉴 트리 구조로 변환
const buildMenuTree = (flatMenus) => {
  const map = new Map();
  const tree = [];

  for (const item of flatMenus) {
    item.children = [];
    map.set(item.id, item);
  }

  for (const item of flatMenus) {
    if (item.parent_id === null) {
      tree.push(item);
    } else {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children.push(item);
      } else {
        console.warn("❗ 부모 메뉴 못 찾음:", item.label);
      }
    }
  }

  return tree;
};

//GET /api/menus
exports.getMenus = async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM menus WHERE active = 1 ORDER BY sort_order ASC`,
      []
    );
    const tree = buildMenuTree(rows);

    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.MENU_LOOKUP,
      `메뉴 목록 조회 (${rows.length}건)`
    );
    res.json(tree);
  } catch (err) {
    console.error("❌ 메뉴 조회 실패:", err.message);
    logSystemAction(
      req,
      req.user ?? null,
      LOG_ACTIONS.MENU_LOOKUP_FAIL,
      `예외 발생: ${err.message}`
    );
    res.status(500).json({ error: "메뉴 조회 실패" });
  }
};
