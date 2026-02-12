// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dowcuvkqn',
  apiKey: '596152245134275',
  apiSecret: '3iy1EkpPGhtGwqDU15Uq71LVJ90'
};

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

// Generate authentication signature for upload
async function generateSignature(params: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  const signatureString = sortedParams + CLOUDINARY_CONFIG.apiSecret;
  return await sha1(signatureString);
}

// SHA-1 hash function
async function sha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const uploadToCloudinary = async (imageUrl: string): Promise<CloudinaryUploadResult> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const params = {
      timestamp,
      folder: 'autismus'
    };
    
    const signature = await generateSignature(params);

    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', params.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error response:', errorData);
      throw new Error(`Failed to upload to Cloudinary: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Cloudinary upload success:', result);
    return {
      public_id: result.public_id,
      secure_url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const params = {
      public_id: publicId,
      timestamp
    };
    
    const signature = await generateSignature(params);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary delete error response:', errorData);
      throw new Error(`Failed to delete from Cloudinary: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};
