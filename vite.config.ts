import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Thuộc tính 'base' chỉ định đường dẫn công khai gốc.
  // Khi triển khai lên GitHub Pages cho repository 'Quan-ly-thong-tin-cccd',
  // URL sẽ có dạng https://hoangndase-vna.github.io/Quan-ly-thong-tin-cccd/.
  // Bằng cách đặt base thành '/Quan-ly-thong-tin-cccd/', Vite sẽ tự động
  // điều chỉnh các đường dẫn tài nguyên để chúng trỏ đến đúng vị trí,
  // khắc phục lỗi trang trắng.
  base: '/Quan-ly-thong-tin-cccd/',
});
