// Netlify build plugin to copy index.html to auth callback paths
import fs from 'fs';
import path from 'path';

export const onPostBuild = async ({ constants, utils }) => {
  console.log('Running copy-auth-pages plugin...');
  
  const publishDir = constants.PUBLISH_DIR;
  const indexPath = path.join(publishDir, 'index.html');
  
  // Create directories if they don't exist
  const authDir = path.join(publishDir, 'auth');
  const authV1Dir = path.join(publishDir, 'auth', 'v1');
  
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  if (!fs.existsSync(authV1Dir)) {
    fs.mkdirSync(authV1Dir, { recursive: true });
  }
  
  // Copy index.html to auth callback paths
  const authCallbackPath = path.join(publishDir, 'auth', 'callback.html');
  const authV1CallbackPath = path.join(publishDir, 'auth', 'v1', 'callback.html');
  
  try {
    // Read the index.html file
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Write to auth callback paths
    fs.writeFileSync(authCallbackPath, indexContent);
    fs.writeFileSync(authV1CallbackPath, indexContent);
    
    console.log('Successfully copied index.html to auth callback paths');
  } catch (error) {
    utils.build.failBuild('Failed to copy index.html to auth callback paths', { error });
  }
};
