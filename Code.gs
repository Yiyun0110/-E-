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
var SPREADSHEET_ID = '1wcTf4RCT8SAHrRxrpAyReOvOMEy40ebBxajAT8Mcs60';

// ============================================================
// 主入口 - 接收 POST 请求
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetId = data._sheetId || '备案版';
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = getOrCreateSheet(ss, sheetId);

    var row = flattenData(data);
    var headers = getHeaders(sheet, row);

    var values = [];
    for (var i = 0; i < headers.length; i++) {
      values.push(row[headers[i]] || '');
    }
    sheet.appendRow(values);

    var result = JSON.stringify({ success: true, message: '数据已保存' });
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errResult = JSON.stringify({ success: false, message: err.toString() });
    return ContentService.createTextOutput(errResult).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// 辅助函数
// ============================================================

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  var newSheet = ss.insertSheet(name);
  newSheet.appendRow(['提交时间', '问卷编号', '批次号', '问卷版本', '来源标识']);
  return newSheet;
}

function flattenData(obj) {
  var result = {};
  for (var key in obj) {
    var val = obj[key];
    if (Array.isArray(val)) {
      result[key] = val.join(';');
    } else if (typeof val === 'object' && val !== null) {
      var sub = flattenData(val);
      for (var sk in sub) {
        result[key + '_' + sk] = sub[sk];
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

function getHeaders(sheet, row) {
  var headers = [];
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  for (var key in row) {
    if (headers.indexOf(key) === -1) {
      headers.push(key);
    }
  }
  return headers;
}

/**
 * 测试用：手动运行可测试连接
 */
function testConnection() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, '测试');
  sheet.appendRow([new Date().toISOString(), '连接测试成功']);
  Logger.log('连接成功！');
}
