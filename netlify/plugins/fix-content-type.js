// Netlify build plugin to ensure JavaScript files have the correct content type
export const onPostBuild = async ({ utils }) => {
  console.log('Running fix-content-type plugin...');
  
  // Add custom headers to ensure JavaScript files are served with the correct content type
  const headers = [
    {
      for: '/*.js',
      values: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    },
    {
      for: '/*.css',
      values: {
        'Content-Type': 'text/css; charset=utf-8',
      },
    },
    {
      for: '/*.html',
      values: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  ];
  
  try {
    await utils.headers.add(headers);
    console.log('Successfully added content type headers for assets');
  } catch (error) {
    utils.build.failBuild('Failed to add content type headers', { error });
  }
};
