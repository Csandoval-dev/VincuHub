// src/app/utils/image-compressor.ts

export class ImageCompressor {
  
  /**
   * Comprime una imagen a un tamaño máximo
   * @param file Archivo de imagen original
   * @param maxSizeKB Tamaño máximo en KB (default: 400KB)
   * @param quality Calidad de compresión 0-1 (default: 0.8)
   * @returns Promise con la imagen comprimida como Base64
   */
  static async compressImage(
    file: File, 
    maxSizeKB: number = 400,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const img = new Image();
        
        img.onload = () => {
          // Crear canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
          }
          
          // Calcular dimensiones manteniendo aspecto
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200; // Máximo ancho/alto
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a Base64 con calidad
          let base64 = canvas.toDataURL('image/jpeg', quality);
          
          // Si aún es muy grande, reducir más
          let currentQuality = quality;
          while (this.getBase64SizeKB(base64) > maxSizeKB && currentQuality > 0.3) {
            currentQuality -= 0.1;
            base64 = canvas.toDataURL('image/jpeg', currentQuality);
          }
          
          console.log(`📸 Imagen comprimida: ${this.getBase64SizeKB(base64).toFixed(2)}KB`);
          resolve(base64);
        };
        
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Calcula el tamaño de una cadena Base64 en KB
   */
  private static getBase64SizeKB(base64: string): number {
    const stringLength = base64.length - 'data:image/jpeg;base64,'.length;
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
    return sizeInBytes / 1024;
  }
  
  /**
   * Valida si un archivo es una imagen
   */
  static isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }
  
  /**
   * Valida el tamaño del archivo
   */
  static isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
  }
}