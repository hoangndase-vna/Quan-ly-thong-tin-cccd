
import React, { useState, useRef, useCallback } from 'react';
import { extractInfoFromImage } from './services/geminiService';
import { saveData } from './services/googleApiService';
import { ProcessState } from './types';
import { CameraIcon, UploadIcon, CheckCircleIcon, ExclamationCircleIcon, IdCardIcon } from './components/icons';

const App: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessState>(ProcessState.IDLE);
  const [message, setMessage] = useState<string>('');
  const [idError, setIdError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateEmployeeId = (id: string): boolean => {
    const regex = /^VAE\d{5}$/i;
    if (!regex.test(id)) {
      setIdError('Mã NV phải có định dạng VAE + 5 chữ số (ví dụ: VAE00076)');
      return false;
    }
    setIdError('');
    return true;
  };

  const handleEmployeeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setEmployeeId(newId);
    validateEmployeeId(newId);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setMessage('');
      setStatus(ProcessState.IDLE);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const resetState = () => {
    setEmployeeId('');
    setImageFile(null);
    setImagePreviewUrl(null);
    setStatus(ProcessState.IDLE);
    setMessage('');
    setIdError('');
  };

  const handleSubmit = async () => {
    if (!validateEmployeeId(employeeId)) {
      setMessage('Vui lòng nhập Mã NV hợp lệ.');
      setStatus(ProcessState.ERROR);
      return;
    }
    if (!imageFile) {
      setMessage('Vui lòng chọn hoặc chụp ảnh.');
      setStatus(ProcessState.ERROR);
      return;
    }

    setStatus(ProcessState.PROCESSING);
    setMessage('Đang phân tích hình ảnh, vui lòng chờ...');

    try {
      const extractedData = await extractInfoFromImage(imageFile);
      setMessage('Phân tích thành công! Đang lưu dữ liệu...');
      
      const result = await saveData(employeeId, extractedData, imageFile);
      setStatus(ProcessState.SUCCESS);
      setMessage(result.message);
      
      // Clear form after a short delay on success
      setTimeout(() => {
        resetState();
      }, 5000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
      setStatus(ProcessState.ERROR);
      setMessage(errorMessage);
    }
  };

  const isLoading = status === ProcessState.PROCESSING;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 text-slate-600 mb-2">
                <IdCardIcon className="w-8 h-8"/>
                <h1 className="text-2xl md:text-3xl font-bold">Quản lý thông tin CCCD & Hộ chiếu</h1>
            </div>
            <p className="text-slate-500">TTBD NGT HAN</p>
        </header>

        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="space-y-6">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-1">
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employeeId"
                value={employeeId}
                onChange={handleEmployeeIdChange}
                placeholder="Ví dụ: VAE00076"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                  idError ? 'border-red-500 focus:ring-red-300 focus:border-red-500' : 'border-slate-300 focus:ring-blue-300 focus:border-blue-500'
                }`}
                disabled={isLoading}
              />
              {idError && <p className="text-xs text-red-600 mt-1">{idError}</p>}
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Ảnh CCCD / Hộ chiếu <span className="text-red-500">*</span>
              </span>
              <div className="mt-2 flex justify-center items-center w-full h-64 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 p-4 text-center">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Xem trước" className="max-h-full max-w-full object-contain rounded-md" />
                ) : (
                  <div className="text-slate-500">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2">Chưa có ảnh nào được chọn</p>
                    <p className="text-xs text-slate-400 mt-1">Chụp ảnh hoặc tải lên file PNG, JPG</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="file" accept="image/*" capture="user" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border border-blue-600 text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CameraIcon className="w-5 h-5"/>
                Chụp ảnh
              </button>
              
              <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border border-blue-600 text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadIcon className="w-5 h-5"/>
                Tải ảnh lên
              </button>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !!idError || !imageFile || !employeeId}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              )}
              {isLoading ? 'Đang xử lý...' : 'Bắt đầu xử lý'}
            </button>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 text-sm ${
              status === ProcessState.SUCCESS ? 'bg-green-100 text-green-800' :
              status === ProcessState.ERROR ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <div>
                {status === ProcessState.SUCCESS && <CheckCircleIcon className="w-5 h-5 text-green-500"/>}
                {status === ProcessState.ERROR && <ExclamationCircleIcon className="w-5 h-5 text-red-500"/>}
                {status === ProcessState.PROCESSING && 
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
              </div>
              <p className="flex-1">{message}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
