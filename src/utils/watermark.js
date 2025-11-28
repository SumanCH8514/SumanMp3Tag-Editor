export const addWatermarkToImage = (imageFile, options = {}) => {
  const { color = 'yellow', position = 'bottom' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Configure watermark text
      const text = "@SumanOnline_Com";
      const fontSize = Math.max(12, Math.floor(img.height * 0.05)); // 5% of height
      ctx.font = `bold ${fontSize}px Arial`;
      
      // Set Color
      const colors = {
        yellow: 'rgba(255, 255, 0, 0.9)',
        white: 'rgba(255, 255, 255, 0.9)',
        red: 'rgba(255, 0, 0, 0.9)',
        black: 'rgba(0, 0, 0, 0.9)'
      };
      ctx.fillStyle = colors[color] || colors.yellow;
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Position logic
      const padding = Math.max(10, Math.floor(img.height * 0.02)); 
      const x = canvas.width / 2;
      let y;

      switch (position) {
        case 'top':
          y = padding + fontSize;
          break;
        case 'center':
          y = canvas.height / 2;
          break;
        case 'bottom':
        default:
          y = canvas.height - padding - (fontSize / 2);
          break;
      }
      
      ctx.fillText(text, x, y);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob failed'));
        }
      }, imageFile.type, 0.95);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};
