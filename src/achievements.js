export const achievements = [
  {
    id: 'firstCookie',
    name: 'First Cookie',
    description: 'Bake your first cookie',
    condition: (gameState) => gameState && gameState.cookies >= 1,
  },
  {
    id: 'tenCookies',
    name: 'Ten Cookies',
    description: 'Bake 10 cookies',
    condition: (gameState) => gameState && gameState.cookies >= 10,
  },
  // ... other achievements
];
