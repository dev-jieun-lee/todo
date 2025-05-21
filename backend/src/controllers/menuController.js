const { getAllMenus } = require("../models/menuModel");

/**
 * 메뉴 트리 구조로 변환
 */
const buildMenuTree = (flatMenus) => {
  const map = new Map();
  const tree = [];

  // 1. id 기준으로 Map 생성 + children 초기화
  for (const item of flatMenus) {
    item.children = [];
    map.set(item.id, item);
  }

  // 2. parent_id 기준으로 트리 구조 만들기
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
  console.log("🧪 최종 트리 구조:");
  console.dir(tree, { depth: null });
  return tree;
};

/**
 * GET /api/menus
 */
exports.getMenus = (req, res) => {
  getAllMenus((err, rows) => {
    if (err) {
      console.error("❌ 메뉴 조회 실패:", err.message);
      return res.status(500).json({ error: "메뉴 조회 실패" });
    }
    console.log("📊 menus 응답 데이터 수:", rows.length);
    console.table(
      rows.map((r) => ({
        id: r.id,
        label: r.label,
        parent: r.parent_id,
      }))
    );
    const tree = buildMenuTree(rows);
    res.json(tree);
  });
};
