
import { ExtractedData } from '../types';
import { removeVietnameseAccents } from '../utils/formatter';

/*****************************************************************************************
 * QUAN TRỌNG: ĐÂY LÀ DỊCH VỤ GIẢ LẬP (MOCK SERVICE)
 *
 * Lý do: Việc tương tác trực tiếp từ một ứng dụng frontend (chạy trên trình duyệt của người dùng)
 * đến các API của Google Sheets và Google Drive là KHÔNG AN TOÀN và KHÔNG KHẢ THI.
 * Nó đòi hỏi phải lưu trữ các khóa bí mật (API keys, credentials) ở phía client,
 * điều này sẽ khiến chúng bị lộ và có thể bị lạm dụng.
 *
 * Giải pháp thực tế: Cần xây dựng một backend (server-side application), ví dụ như dùng
 * Node.js, Python, hoặc Go. Backend này sẽ:
 * 1. Lưu trữ an toàn các credentials của Google Service Account.
 * 2. Cung cấp các API endpoint mà frontend có thể gọi.
 * 3. Khi nhận được yêu cầu từ frontend, backend sẽ thay mặt ứng dụng để gọi đến
 *    API của Google Sheets và Google Drive một cách an toàn.
 *
 * Mục đích của file này: Mô phỏng lại các hành vi của một backend như vậy để hoàn thiện
 * luồng hoạt động của giao diện người dùng. Nó sử dụng setTimeout để giả lập độ trễ mạng.
 *****************************************************************************************/

// Giả lập một cơ sở dữ liệu nhỏ trên bộ nhớ để kiểm tra Mã NV đã tồn tại hay chưa
const mockDatabase: { [key: string]: any } = {
  "VAE99999": { "Mã NV": "VAE99999", "Họ và tên": "Nguyễn Văn Mẫu", "Ho_va_ten": "NGUYEN VAN MAU", "Số CCCD": "001090000001" }
};

interface SaveResult {
  message: string;
  isUpdate: boolean;
}

export const saveData = async (
  employeeId: string,
  data: ExtractedData,
  imageFile: File
): Promise<SaveResult> => {
  console.log("--- Bắt đầu quá trình lưu dữ liệu (GIẢ LẬP) ---");

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const upperCaseEmployeeId = employeeId.toUpperCase();
        console.log(`1. Chuẩn hóa Mã NV: ${upperCaseEmployeeId}`);

        const existingRecord = mockDatabase[upperCaseEmployeeId];
        const isUpdate = !!existingRecord;

        if (isUpdate) {
            console.log(`2. Tìm thấy Mã NV "${upperCaseEmployeeId}" đã tồn tại. Chuẩn bị cập nhật.`);
             const confirmed = window.confirm(`Mã NV ${upperCaseEmployeeId} đã tồn tại. Bạn có muốn cập nhật thông tin không?`);
            if (!confirmed) {
                return reject(new Error("Người dùng đã hủy bỏ thao tác cập nhật."));
            }
        } else {
            console.log(`2. Mã NV "${upperCaseEmployeeId}" là mã mới. Chuẩn bị tạo dòng mới.`);
        }
        
        const fullNameNoAccent = removeVietnameseAccents(data.fullName).toUpperCase();
        const fileName = `${upperCaseEmployeeId} ${fullNameNoAccent}.${imageFile.name.split('.').pop()}`;
        console.log(`3. Tạo tên file ảnh: "${fileName}"`);
        console.log(`4. (GIẢ LẬP) Đang tải ảnh lên Google Drive...`);

        // Giả lập kiểm tra file trùng tên
        // Trong thực tế, bạn sẽ list files trong folder và kiểm tra
        const finalFileName = fileName; // Giả sử không trùng
        console.log(`   -> Đã tải lên thành công với tên: "${finalFileName}"`);

        const sheetData = {
          "Mã NV": upperCaseEmployeeId,
          "Họ và tên": data.fullName,
          "Ho_va_ten": fullNameNoAccent,
          "Ngày sinh": data.dob,
          "Số CCCD": data.idNumber,
          "Nơi cấp": data.issuePlace,
          "SỐ HỘ CHIẾU": data.passportNumber,
          "HẠN HỘ CHIẾU": data.passportExpiry,
        };

        if (isUpdate) {
            console.log("5. (GIẢ LẬP) Đang cập nhật dòng trong Google Sheet...");
            // Chỉ cập nhật các trường có dữ liệu mới
            const updatedRecord = { ...existingRecord };
            for (const key in sheetData) {
                if (sheetData[key as keyof typeof sheetData]) {
                    updatedRecord[key] = sheetData[key as keyof typeof sheetData];
                }
            }
            mockDatabase[upperCaseEmployeeId] = updatedRecord;
            console.log("   -> Cập nhật thành công. Dữ liệu mới:", updatedRecord);
        } else {
            console.log("5. (GIẢ LẬP) Đang thêm dòng mới vào Google Sheet...");
            mockDatabase[upperCaseEmployeeId] = sheetData;
            console.log("   -> Thêm mới thành công. Dữ liệu:", sheetData);
        }
        
        console.log("--- Quá trình giả lập hoàn tất ---");
        resolve({
          message: isUpdate ? `Đã cập nhật thành công thông tin cho Mã NV: ${upperCaseEmployeeId}` : `Đã thêm mới thành công thông tin cho Mã NV: ${upperCaseEmployeeId}`,
          isUpdate,
        });

      } catch (error) {
        console.error("Lỗi trong quá trình giả lập:", error);
        reject(new Error("Đã xảy ra lỗi trong quá trình giả lập lưu dữ liệu."));
      }
    }, 2000); // Giả lập độ trễ mạng 2 giây
  });
};
