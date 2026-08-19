const fs = require('fs');
const path = './src/components/AdminView.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '  if (!isAdminUnlocked) {';
const endStr = '  const handleSyncDatabaseProducts = async () => {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync(path, content);
    console.log("Successfully removed passcode check.");
} else {
    console.log("Could not find start or end strings.");
}
