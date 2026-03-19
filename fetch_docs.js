import fs from 'fs';
fetch('https://www.atlascloud.ai/models/google/nano-banana-pro/text-to-image?tab=api')
  .then(res => res.text())
  .then(text => fs.writeFileSync('atlas_docs.html', text));
