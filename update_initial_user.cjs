const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldInitialUser = `const INITIAL_USER: UserProfile = {
  name: 'Karim Chamoun',
  email: 'karim.chamoun@yalla.lb',
  phone: '+961 70 123 456',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  defaultGovernorate: 'beirut',
  defaultCity: 'Achrafieh',
  defaultAddress: 'Sursock Street, Building 14, 3rd Floor'
};`;

const newInitialUser = `const INITIAL_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  defaultGovernorate: '',
  defaultCity: '',
  defaultAddress: ''
};`;

content = content.replace(oldInitialUser, newInitialUser);
fs.writeFileSync(path, content);
console.log('Updated INITIAL_USER to empty guest profile');
