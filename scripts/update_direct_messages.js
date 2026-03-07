import fs from 'fs';
let c = fs.readFileSync('src/components/messages/MessagesContext.tsx', 'utf-8');
c = c.replace(/"direct_messages"/g, '"c_direct_messages"');
fs.writeFileSync('src/components/messages/MessagesContext.tsx', c);
console.log('Updated direct_messages');
