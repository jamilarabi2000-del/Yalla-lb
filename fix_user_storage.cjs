const fs = require('fs');
const path = './src/context/ShopContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('yallalb_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });`;

const replacement = `  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('yallalb_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'karim.chamoun@yalla.lb' || parsed.name === 'Karim Chamoun') {
          return INITIAL_USER;
        }
        return parsed;
      }
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Fixed user storage loading to ignore Karim');
