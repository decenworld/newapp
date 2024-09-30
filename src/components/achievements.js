export const achievements = [
  { id: 1, name: "Cookie Rookie", description: "Bake your first cookie", condition: (state) => state.cookies_collected >= 1 },
  { id: 2, name: "Cookie Monster", description: "Bake 100 cookies", condition: (state) => state.cookies_collected >= 100 },
  { id: 3, name: "Cookie Tycoon", description: "Bake 1,000 cookies", condition: (state) => state.cookies_collected >= 1000 },
  { id: 4, name: "First Purchase", description: "Buy your first building", condition: (state) => state.buildings.some(b => b.count > 0) },
  { id: 5, name: "Cookie Empire", description: "Own 10 of any building", condition: (state) => state.buildings.some(b => b.count >= 10) },
  // Add more achievements as needed
];
