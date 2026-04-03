
// ===== GAS saveAutoReplyAPI 修正版 =====
// 支援 originalKeyword：編輯時先刪舊關鍵字那筆，再寫新的

function saveAutoReplyAPI(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_AUTO_REPLY);
    const allData = sheet.getDataRange().getValues();

    // 如果有 originalKeyword（編輯模式），先找舊的那筆刪掉
    if (data.originalKeyword && data.originalKeyword !== data.keyword) {
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.originalKeyword) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      // 刪完後直接 append 新的
      sheet.appendRow([
        data.keyword,
        data.content,
        data.status,
        data.startTime || '',
        data.endTime || ''
      ]);
      return { success: true };
    }

    // 一般新增/更新（keyword 沒變）
    const currentData = sheet.getDataRange().getValues();
    for (let i = 1; i < currentData.length; i++) {
      if (currentData[i][0] === data.keyword) {
        sheet.getRange(i + 1, 2).setValue(data.content);
        sheet.getRange(i + 1, 3).setValue(data.status);
        sheet.getRange(i + 1, 4).setValue(data.startTime || '');
        sheet.getRange(i + 1, 5).setValue(data.endTime || '');
        return { success: true };
      }
    }

    // 找不到 → 新增
    sheet.appendRow([
      data.keyword,
      data.content,
      data.status,
      data.startTime || '',
      data.endTime || ''
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('saveAutoReplyAPI Error: ' + error);
    return { success: false, error: error.toString() };
  }
}
