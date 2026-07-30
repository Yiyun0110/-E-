/**
 * 维生素E尿素乳霜问卷 - 数据收集后端
 *
 * 部署说明：
 * 1. 打开 https://script.google.com/
 * 2. 新建项目，粘贴本代码
 * 3. 将 spreadsheetId 替换为您的 Google Sheet ID
 * 4. 部署 → 新建部署 → Web 应用
 *    - 执行身份：任何人
 *    - 访问权限：任何人
 * 5. 复制部署 URL，填入问卷 HTML 的 ENDPOINT_URL 中
 */

// ============================================================
// 配置区 - 请替换为您的信息
// ============================================================

// 您的 Google Sheet ID（从表格URL中获取）
// 格式：https://docs.google.com/spreadsheets/d/【这串ID】/edit
const SPREADSHEET_ID = '请替换为您的GoogleSheetID';

// ============================================================
// 主入口 - 接收 POST 请求
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetId = data._sheetId || '备案版';  // 区分问卷版本
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet(ss, sheetId);

    // 将数据扁平化为一行
    const row = flattenData(data);
    const headers = getHeaders(sheet, row);

    // 写入数据
    sheet.appendRow(headers.map(h => row[h] ?? ''));

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '数据已保存' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取或创建指定名称的Sheet页
 */
function getOrCreateSheet(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  const newSheet = ss.insertSheet(name);

  // 写入标题行
  const row = {
    timestamp: '提交时间',
    id: '问卷编号',
    batchNo: '样品批号',
    _source: '问卷版本',
    _sheetId: '版本标识',
  };
  const headers = Object.keys(row);
  newSheet.appendRow(headers);

  return newSheet;
}

/**
 * 扁平化嵌套数据
 */
function flattenData(obj, prefix = '', result = {}) {
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}_${key}` : key;
    if (Array.isArray(val)) {
      result[path] = val.join(';');
    } else if (val !== null && typeof val === 'object') {
      flattenData(val, path, result);
    } else {
      result[path] = val;
    }
  }
  return result;
}

/**
 * 获取表头（首次+追加新列）
 */
function getHeaders(sheet, row) {
  let headers = [];
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  // 追加新列
  const newKeys = Object.keys(row).filter(k => !headers.includes(k));
  if (newKeys.length > 0) {
    headers = [...headers, ...newKeys];
  }

  return headers;
}

/**
 * 测试用：手动运行可测试连接
 */
function testConnection() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss, '测试');
  sheet.appendRow([new Date().toISOString(), '连接测试成功']);
  Logger.log('✅ 连接成功！');
}
