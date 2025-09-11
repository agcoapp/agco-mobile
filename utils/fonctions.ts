import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

export const cleanCodeFormulaire = (code: string) => {
    if (!code) return 'Non spécifié';
    return code.replace(/^N°/, '').trim();
  };

export const convertImageToBase64WithTransparency = async (
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
  preserveTransparency: boolean = false
): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUrl,
        (origWidth, origHeight) => {
          const scale = Math.min(maxWidth / origWidth, maxHeight / origHeight);
          const newWidth = Math.round(origWidth * scale);
          const newHeight = Math.round(origHeight * scale);

          ImageManipulator.manipulateAsync(
            imageUrl,
            [{ resize: { width: newWidth, height: newHeight } }],
            {
              compress: quality,
              format: preserveTransparency ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          ).then(processed => {
            if (processed.base64) {
              const format = preserveTransparency ? 'png' : 'jpeg';
              resolve(`data:image/${format};base64,${processed.base64}`);
            } else {
              reject(new Error('Failed to generate base64'));
            }
          }).catch(reject);
        },
        reject
      );
    });
  } catch (error) {
    console.error('Error in image conversion:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
};

export const convertImageToBase64 = async (imageUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
  return await convertImageToBase64WithTransparency(imageUrl, maxWidth, maxHeight, quality, false);
};
  