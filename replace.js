const fs = require('fs');
let content = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">\s*\{featuredProducts\.map\(\(product\) => \(\s*<ProductCard key=\{product\.id\} product=\{product\} \/>\s*\)\)\}\s*<\/div>/g,
  `<ProductCarousel products={featuredProducts} idPrefix="featured" />`
);

content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">\s*\{todaysDeals\.map\(\(product\) => \(\s*<ProductCard key=\{.*?\} product=\{product\} \/>\s*\)\)\}\s*<\/div>/g,
  `<ProductCarousel products={todaysDeals} idPrefix="deals" />`
);

content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">\s*\{newArrivals\.slice\(0, 8\)\.map\(\(product\) => \(\s*<ProductCard key=\{.*?\} product=\{product\} \/>\s*\)\)\}\s*<\/div>/g,
  `<ProductCarousel products={newArrivals.slice(0, 8)} idPrefix="new" />`
);

fs.writeFileSync('src/components/HomeView.tsx', content);
