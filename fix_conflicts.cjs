const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                if (!file.includes('node_modules') && !file.includes('.git')) {
                    results = results.concat(walkDir(file));
                }
            } else {
                results.push(file);
            }
        });
    } catch (e) { }
    return results;
}

const files = walkDir('./src');
let fixedCount = 0;

files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('<<<<<<< HEAD')) {
            const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>>[^\r\n]*\r?\n?/g;
            const newContent = content.replace(regex, '$1');
            if (newContent !== content) {
                fs.writeFileSync(file, newContent);
                fixedCount++;
                console.log(`Fixed ${file}`);
            }
        }
    }
});
console.log(`Fixed ${fixedCount} files`);
