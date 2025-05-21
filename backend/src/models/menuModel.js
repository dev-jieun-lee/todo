const db = require("../config/db");

/**
 * 전체 메뉴 목록 조회 (정렬 포함)
 */
exports.getAllMenus = (callback) => {
  const query = `
    SELECT * FROM menus
    ORDER BY parent_id IS NULL DESC, parent_id, sort_order
  `;
  db.all(query, [], callback);
};
