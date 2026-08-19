const fs = require('fs');
const path = './src/components/CheckoutView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The stripping script left an extra </div> after removing payment methods
content = content.replace(
  /<\/div>\s*<\/div>\s*\{\/\* Right Column: Order Summary Card \*\/\}/,
  '</div>\n            {/* Right Column: Order Summary Card */}'
);

fs.writeFileSync(path, content);
console.log("Fixed CheckoutView.tsx successfully.");
