# Hướng dẫn kết nối ứng dụng với Google Sheet và Google Drive

Để ứng dụng có thể ghi dữ liệu vào Google Sheet và tải ảnh lên Google Drive của bạn một cách an toàn, bạn cần tạo một "cầu nối" bằng Google Apps Script. Vui lòng làm theo các bước dưới đây.

## Bước 1: Tạo và Cấu hình Google Apps Script

1.  **Mở Google Sheet:** Truy cập vào trang tính của bạn: [Data Sheet](https://docs.google.com/spreadsheets/d/1vm3schT7Yb_s9ylf3VudiOz2ZU-8yYsBwOaMlKjVw2Q/edit)

2.  **Mở Trình chỉnh sửa Apps Script:**
    *   Trên thanh menu, chọn `Tiện ích mở rộng` (Extensions) -> `Apps Script`.
    *   Một tab mới sẽ mở ra với trình soạn thảo mã.

3.  **Dán mã kịch bản:**
    *   Xóa toàn bộ nội dung mặc định trong file `Code.gs`.
    *   Sao chép (copy) toàn bộ mã dưới đây và dán (paste) vào file `Code.gs`.

    ```javascript
    // Dán toàn bộ mã script vào đây
    const SHEET_NAME = 'Data';
    // ID thư mục Google Drive bạn muốn lưu ảnh vào
    // Lấy từ URL: https://drive.google.com/drive/folders/ID_THU_MUC_O_DAY
    const FOLDER_ID = '10UcJHyRmJ4FIg_YVyKxfIqyyOBSJ0Nf9';

    function doPost(e) {
      try {
        const data = JSON.parse(e.postData.contents);
        const employeeId = data.employeeId.toUpperCase();
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const idColumnIndex = headers.indexOf('Mã NV') + 1;
        
        if (idColumnIndex === 0) {
          throw new Error(`Không tìm thấy cột 'Mã NV' trong trang tính.`);
        }

        const idColumnValues = sheet.getRange(2, idColumnIndex, sheet.getLastRow(), 1).getValues();
        
        let rowIndex = -1;
        for (let i = 0; i < idColumnValues.length; i++) {
            if (idColumnValues[i][0] && idColumnValues[i][0].toString().toUpperCase() === employeeId) {
                rowIndex = i + 2; // +2 vì sheet 1-indexed và bắt đầu từ hàng 2
                break;
            }
        }

        if (rowIndex !== -1 && !data.update) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'conflict',
            message: `Mã NV ${employeeId} đã tồn tại. Bạn có muốn cập nhật thông tin không?`
          })).setMimeType(ContentService.MimeType.JSON);
        }
        
        uploadImage(data.imageFile, employeeId, data.extractedData.Ho_va_ten);

        const rowData = headers.map(header => {
          switch(header) {
            case 'Mã NV': return employeeId;
            case 'Họ và tên': return data.extractedData.fullName;
            case 'Ho_va_ten': return data.extractedData.Ho_va_ten;
            case 'Ngày sinh': return data.extractedData.dob;
            case 'Số CCCD': return data.extractedData.idNumber;
            case 'Nơi cấp': return data.extractedData.issuePlace;
            case 'SỐ HỘ CHIẾU': return data.extractedData.passportNumber;
            case 'HẠN HỘ CHIẾU': return data.extractedData.passportExpiry;
            default: return '';
          }
        });

        if (rowIndex !== -1) { // Cập nhật
          const existingRowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
          const updatedRow = rowData.map((newValue, index) => newValue || existingRowValues[index]);
          sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
          return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: `Đã cập nhật thành công thông tin cho Mã NV: ${employeeId}`
          })).setMimeType(ContentService.MimeType.JSON);
        } else { // Thêm mới
          sheet.appendRow(rowData);
          return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: `Đã thêm mới thành công thông tin cho Mã NV: ${employeeId}`
          })).setMimeType(ContentService.MimeType.JSON);
        }

      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Lỗi kịch bản Google Script: ' + err.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    function uploadImage(fileData, employeeId, fullNameNoAccent) {
      try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const { mimeType, data } = fileData;
        const decodedData = Utilities.base64Decode(data);
        const blob = Utilities.newBlob(decodedData, mimeType);
        
        const fileExtension = mimeType.split('/')[1] || 'jpg';
        let baseFileName = `${employeeId} ${fullNameNoAccent}`;
        let finalFileName = `${baseFileName}.${fileExtension}`;
        
        let files = folder.getFilesByName(finalFileName);
        let count = 1;
        while (files.hasNext()) {
          finalFileName = `${baseFileName}-${count}.${fileExtension}`;
          files = folder.getFilesByName(finalFileName);
          count++;
        }
        
        const file = folder.createFile(blob);
        file.setName(finalFileName);
        return file.getUrl();
      } catch (err) {
        throw new Error('Không thể tải ảnh lên Google Drive: ' + err.toString());
      }
    }
    ```

4.  **Lưu dự án:** Nhấn vào biểu tượng đĩa mềm (Lưu dự án) và đặt tên cho dự án, ví dụ: "CCCD App Backend".

## Bước 2: Triển khai kịch bản thành Web App

1.  **Mở trang triển khai:**
    *   Ở góc trên bên phải, nhấp vào nút `Triển khai` (Deploy).
    *   Chọn `Tạo mục triển khai mới` (New deployment).

2.  **Cấu hình mục triển khai:**
    *   Nhấp vào biểu tượng bánh răng (bên cạnh "Chọn loại") và chọn **`Ứng dụng web`** (Web app).
    *   Trong phần cấu hình:
        *   **Mô tả:** (Không bắt buộc) `API cho ứng dụng quản lý CCCD`.
        *   **Thực thi với quyền:** Chọn **`Tôi`** (Me).
        *   **Ai có quyền truy cập:** **QUAN TRỌNG:** Chọn **`Bất kỳ ai`** (Anyone). Điều này cho phép trang web của bạn gửi dữ liệu đến kịch bản này.

3.  **Triển khai:**
    *   Nhấp vào nút `Triển khai` (Deploy).
    *   **Cấp quyền:** Lần đầu tiên triển khai, Google sẽ yêu cầu bạn cấp quyền cho kịch bản.
        *   Nhấp vào `Ủy quyền truy cập` (Authorize access).
        *   Chọn tài khoản Google của bạn.
        *   Bạn có thể thấy một màn hình cảnh báo "Google chưa xác minh ứng dụng này". Hãy nhấp vào `Nâng cao` (Advanced) và sau đó chọn `Chuyển đến [tên dự án của bạn] (không an toàn)` (Go to ... (unsafe)).
        *   Xem lại các quyền và nhấp vào `Cho phép` (Allow).

4.  **Sao chép URL ứng dụng web:**
    *   Sau khi triển khai thành công, một hộp thoại sẽ hiện ra với **`URL ứng dụng web`**.
    *   Nhấp vào nút `Sao chép` (Copy). URL này trông giống như: `https://script.google.com/macros/s/..../exec`.

## Bước 3: Cập nhật mã nguồn Frontend

Bây giờ, bạn cần dán URL vừa sao chép vào mã nguồn của ứng dụng. Tôi đã cập nhật file `services/googleApiService.ts` để bạn có thể dán URL vào vị trí được chỉ định.
