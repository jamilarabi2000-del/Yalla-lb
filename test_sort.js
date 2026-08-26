const a = { createdAt: '2026-08-26T10:00:00Z' };
const b = { createdAt: '2026-08-25T10:00:00Z' };
const c = {};
const arr = [c, b, a];
arr.sort((x, y) => {
  if (x.createdAt && y.createdAt) {
    return new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime();
  }
  if (x.createdAt) return -1;
  if (y.createdAt) return 1;
  return 0;
});
console.log(arr);
