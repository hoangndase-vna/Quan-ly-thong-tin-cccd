import { ExtractedData } from '../types';
import { removeVietnameseAccents } from '../utils/formatter';

/*****************************************************************************************
 * QUAN TRỌNG: DỊCH VỤ KẾT NỐI VỚI GOOGLE APPS SCRIPT
 *
 * Dịch vụ này gửi dữ liệu đến một Web App được tạo bằng Google Apps Script,
 * hoạt động như một backend an toàn để xử lý việc ghi dữ liệu vào Google Sheet
 * và tải ảnh lên Google Drive.
 *
 * BẠN CẦN THỰC HIỆN:
 * 1. Làm theo hướng dẫn trong file `instructions.md` để tạo và triển khai Apps Script.
 * 2. Sao chép URL Web App bạn nhận được sau khi triển khai.
 * 3. Dán URL đó vào hằng số `GOOGLE_SCRIPT_URL` dưới đây.
 *****************************************************************************************/

const GOOGLE_SCRIPT_URL = 'DÁN_URL_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY';

interface SaveResult {
  message: string;
  isUpdate: boolean;
}

// Hàm trợ giúp chuyển đổi File thành chuỗi base64 để gửi đi
const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const saveData = async (
  employeeId: string,
  data: ExtractedData,
  imageFile: File
): Promise<SaveResult> => {

  if (GOOGLE_SCRIPT_URL === 'DÁN_URL_APPS_SCRIPT_CỦA_BẠN_VÀO_ĐÂY') {
    throw new Error('Vui lòng cấu hình URL Google Apps Script trong file services/googleApiService.ts');
  }

  console.log("--- Bắt đầu quá trình lưu dữ liệu thật ---");
  
  const fullNameNoAccent = removeVietnameseAccents(data.fullName).toUpperCase();
  const imageFileData = await fileToBase64(imageFile);

  const payload = {
    employeeId: employeeId.toUpperCase(),
    update: false,
    extractedData: {
      ...data,
      Ho_va_ten: fullNameNoAccent,
    },
    imageFile: imageFileData,
  };

  // --- CUỘC GỌI API ĐẦU TIÊN: KIỂM TRA VÀ GHI NẾU LÀ BẢN GHI MỚI ---
  console.log("1. Gửi yêu cầu thêm mới/kiểm tra đến Google Apps Script...");
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  // --- XỬ LÝ TRƯỜNG HỢP MÃ NV ĐÃ TỒN TẠI (XUNG ĐỘT) ---
  if (result.status === 'conflict') {
    console.log("2. Mã NV đã tồn tại. Yêu cầu người dùng xác nhận cập nhật.");
    const confirmed = window.confirm(result.message);

    if (confirmed) {
      // --- CUỘC GỌI API THỨ HAI: GỬI LẠI VỚI CỜ `update = true` ---
      console.log("3. Người dùng đã xác nhận. Gửi yêu cầu cập nhật...");
      payload.update = true;
      const updateResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const updateResult = await updateResponse.json();
      if (updateResult.status !== 'success') {
        throw new Error(updateResult.message || 'Cập nhật không thành công.');
      }
      
      console.log("4. Cập nhật thành công.");
      return { message: updateResult.message, isUpdate: true };

    } else {
      console.log("2a. Người dùng đã hủy bỏ cập nhật.");
      throw new Error("Người dùng đã hủy bỏ thao tác cập nhật.");
    }
  } 
  // --- XỬ LÝ LỖI KHÁC TỪ APPS SCRIPT ---
  else if (result.status !== 'success') {
    throw new Error(result.message || 'Đã xảy ra lỗi không xác định từ phía máy chủ.');
  }

  // --- XỬ LÝ THÊM MỚI THÀNH CÔNG ---
  console.log("1a. Thêm mới thành công.");
  return { message: result.message, isUpdate: false };
};
