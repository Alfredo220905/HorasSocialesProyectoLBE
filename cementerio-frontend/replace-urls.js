const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace 'http://localhost:8081/api...' with `${environment.apiUrl}...`
    content = content.replace(/'http:\/\/localhost:8081\/api([^']*)'/g, '`${environment.apiUrl}$1`');
    
    // Replace `http://localhost:8081/api...` with `${environment.apiUrl}...`
    content = content.replace(/`http:\/\/localhost:8081\/api([^`]*)`/g, '`${environment.apiUrl}$1`');

    if (content !== originalContent) {
      // Calculate depth to environments folder
      const depth = filePath.split(path.sep).length - 2; // -2 because of 'src' and the file itself
      let relativePath = '';
      for(let i=0; i<depth - 1; i++) {
         relativePath += '../';
      }
      if(relativePath === '') relativePath = './';
      
      const importStatement = `import { environment } from 'src/environments/environment';\n`;
      if (!content.includes('import { environment }')) {
        content = importStatement + content;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
