
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    fullName: {
      type: Type.STRING,
      description: "Họ và tên đầy đủ của người trong giấy tờ, viết hoa chữ cái đầu mỗi từ.",
    },
    dob: {
      type: Type.STRING,
      description: "Ngày tháng năm sinh, định dạng DD/MM/YYYY.",
    },
    idNumber: {
      type: Type.STRING,
      description: "Số Căn cước công dân (12 chữ số), bao gồm cả số 0 ở đầu nếu có.",
    },
    issuePlace: {
      type: Type.STRING,
      description: "Nơi cấp Căn cước công dân.",
    },
    passportNumber: {
      type: Type.STRING,
      description: "Số hộ chiếu. Trả về chuỗi rỗng nếu không có.",
    },
    passportExpiry: {
      type: Type.STRING,
      description: "Ngày hết hạn hộ chiếu, định dạng DD/MM/YYYY. Trả về chuỗi rỗng nếu không có.",
    },
  },
  required: ["fullName", "dob", "idNumber", "issuePlace", "passportNumber", "passportExpiry"],
};


const fileToGenerativePart = (file: File) => {
  return new Promise<{inlineData: {data: string, mimeType: string}}>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file"));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const extractInfoFromImage = async (imageFile: File): Promise<ExtractedData> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `
      Phân tích hình ảnh của giấy tờ tùy thân này (Căn cước công dân hoặc Hộ chiếu Việt Nam).
      Trích xuất các thông tin sau và trả về dưới dạng JSON theo schema đã cung cấp.
      - Họ và tên: Viết hoa chữ cái đầu của mỗi từ.
      - Ngày sinh: Định dạng DD/MM/YYYY.
      - Số CCCD: Chính xác 12 chữ số, kể cả số 0 đứng đầu. Nếu là hộ chiếu, trường này có thể rỗng.
      - Nơi cấp CCCD: Ghi rõ nơi cấp. Nếu là hộ chiếu, trường này có thể rỗng.
      - Số Hộ chiếu: Nếu có.
      - Hạn Hộ chiếu: Nếu có, định dạng DD/MM/YYYY.
      Nếu không tìm thấy thông tin nào, hãy trả về một chuỗi rỗng cho trường đó.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);

    // Ensure all keys exist, even if empty
    return {
      fullName: parsedData.fullName || '',
      dob: parsedData.dob || '',
      idNumber: parsedData.idNumber || '',
      issuePlace: parsedData.issuePlace || '',
      passportNumber: parsedData.passportNumber || '',
      passportExpiry: parsedData.passportExpiry || '',
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Không thể phân tích hình ảnh. Vui lòng thử lại với ảnh rõ nét hơn.");
  }
};
