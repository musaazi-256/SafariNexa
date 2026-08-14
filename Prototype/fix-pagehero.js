const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles(dir) {
  walkDir(dir, function(filePath) {
    if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('<PageHero') && !content.includes('variant="portal"')) {
         let newContent = content.replace(/<PageHero/g, '<PageHero variant="portal"');
         if (newContent !== content) {
           fs.writeFileSync(filePath, newContent, 'utf8');
           console.log('Updated PageHero in ' + filePath);
         }
      }
    }
  });
}

processFiles('./src/app/admin');
processFiles('./src/app/business');
