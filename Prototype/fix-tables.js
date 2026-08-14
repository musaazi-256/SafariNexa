const fs = require('fs');
const glob = require('glob'); // Assuming glob is available, or use a simple recursive walk.
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('<Table>')) {
      let originalContent = content;
      // Make sure we haven't already wrapped it
      if (!content.includes('className="rounded-md border bg-card"')) {
         content = content.replace(/<Table>/g, '<div className="rounded-md border bg-card overflow-hidden">\n            <Table>');
         content = content.replace(/<\/Table>/g, '</Table>\n          </div>');
         if (content !== originalContent) {
           fs.writeFileSync(filePath, content, 'utf8');
           console.log('Updated ' + filePath);
         }
      }
    }
  }
});
