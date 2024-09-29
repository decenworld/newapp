const cookie = document.getElementById('cookie');
const cookieCount = document.querySelector('.cookie-count');
const cpsDisplay = document.querySelector('.cps');
const store = document.getElementById('store');
const navStore = document.getElementById('nav-store');
const navCookie = document.getElementById('nav-cookie');
const achievementDisplay = document.getElementById('achievement');
let cookies = 0;
let cps = 0;
let lastClickTime = 0;
const clickCooldown = 250; // 250ms cooldown (4 clicks per second)

const upgrades = [
    { name: "Cursor", description: "Autoclicks once every 10 seconds.", baseCost: 15, cps: 0.1, count: 0 },
    { name: "Grandma", description: "A nice grandma to bake more cookies.", baseCost: 100, cps: 1, count: 0 },
    { name: "Farm", description: "Grows cookie plants from cookie seeds.", baseCost: 1100, cps: 8, count: 0 },
    { name: "???", description: "Unlocks at 12,000 cookies", baseCost: 12000, cps: 0, count: 0, locked: true },
    { name: "???", description: "Unlocks at 130,000 cookies", baseCost: 130000, cps: 0, count: 0, locked: true }
];

function updateCookieCount() {
    cookieCount.textContent = `${Math.floor(cookies)} cookies`;
    cpsDisplay.textContent = `${cps.toFixed(1)}/s`;
}

function createCookieCrumb(x, y) {
    const crumb = document.createElement('div');
    crumb.className = 'cookie-crumb';
    crumb.textContent = '+1';
    crumb.style.left = `${x}px`;
    crumb.style.top = `${y}px`;
    document.querySelector('.cookie-area').appendChild(crumb);
    setTimeout(() => crumb.remove(), 1000);
}

cookie.addEventListener('click', (event) => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime >= clickCooldown) {
        cookies++;
        lastClickTime = currentTime;
        updateCookieCount();
        const rect = cookie.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        createCookieCrumb(x, y);
    }
});

function renderStore() {
    store.innerHTML = `
        <div class="store-header">
            Upgrades
            <span class="store-close">&times;</span>
        </div>
    `;
    upgrades.forEach((upgrade, index) => {
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade-item';
        if (upgrade.locked) {
            upgradeElement.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">???</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                </div>
            `;
        } else {
            upgradeElement.innerHTML = `
                <div class="upgrade-icon">${upgrade.name[0]}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name} (${upgrade.count})</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                </div>
                <div class="upgrade-buttons">
                    <button class="buy-button" ${cookies < upgrade.baseCost * Math.pow(1.15, upgrade.count) ? 'disabled' : ''}>
                        Buy 1 (${Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count))} cookies)
                    </button>
                    <button class="info-button">info</button>
                </div>
            `;
            upgradeElement.querySelector('.buy-button').addEventListener('click', () => buyUpgrade(index));
        }
        
        store.appendChild(upgradeElement);
    });
    // Add event listener for the close button
    const closeButton = store.querySelector('.store-close');
    closeButton.addEventListener('click', () => {
        store.style.display = 'none';
    });
}

function buyUpgrade(index) {
    const upgrade = upgrades[index];
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
    if (cookies >= cost) {
        cookies -= cost;
        upgrade.count++;
        cps += upgrade.cps;
        updateCookieCount();
        renderStore();
        if (upgrade.name === "Farm" && upgrade.count === 1) {
            showAchievement("Bought the farm");
        }
    }
}

function showAchievement(text) {
    achievementDisplay.textContent = `Achievement unlocked: ${text}`;
    achievementDisplay.style.display = 'block';
    setTimeout(() => {
        achievementDisplay.style.display = 'none';
    }, 3000);
}

navStore.addEventListener('click', () => {
    store.style.display = 'flex';
});

navCookie.addEventListener('click', () => {
    store.style.display = 'none';
});

setInterval(() => {
    cookies += cps / 10;
    updateCookieCount();
}, 100);

updateCookieCount();
renderStore();