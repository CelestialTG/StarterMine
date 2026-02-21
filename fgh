:root {
    --bg-dark: #050505;
    --neon-green: #39ff14;
    --neon-purple: #b026ff;
    --neon-blue: #00f0ff;
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.1);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Outfit', sans-serif;
    background-color: var(--bg-dark);
    color: #fff;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
    overflow-x: hidden;
    position: relative;
}

/* ФОНОВЫЕ СФЕРЫ */
.bg-orbs {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: -1;
    overflow: hidden;
    filter: blur(100px);
}

.orb {
    position: absolute;
    border-radius: 50%;
    animation: float 15s infinite alternate ease-in-out;
}

.orb-1 {
    width: 500px; height: 500px;
    background: var(--neon-purple);
    top: -100px; left: -100px;
}

.orb-2 {
    width: 600px; height: 600px;
    background: var(--neon-blue);
    bottom: -200px; right: -100px;
    animation-delay: -5s;
}

.orb-3 {
    width: 400px; height: 400px;
    background: var(--neon-green);
    top: 40%; left: 40%;
    animation-delay: -10s;
    opacity: 0.5;
}

@keyframes float {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(100px, 50px) scale(1.2); }
}

/* СТЕКЛЯННЫЙ КОНТЕЙНЕР */
.glass-container {
    background: var(--glass-bg);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    border-radius: 40px;
    padding: 50px;
    width: 100%;
    max-width: 1400px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05);
    z-index: 1;
}

/* HEADER */
.max-header {
    text-align: center;
    margin-bottom: 50px;
}

.glitch-title {
    font-size: 5rem;
    font-weight: 900;
    letter-spacing: -2px;
    background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    position: relative;
    display: inline-block;
}

.subtitle {
    font-family: 'Pixelify Sans', cursive;
    color: var(--neon-green);
    font-size: 1.5rem;
    letter-spacing: 5px;
    margin-top: -10px;
}

/* ФИЛЬТРЫ */
.max-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 50px;
    align-items: flex-end;
}

.input-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 250px;
}

.search-wrapper {
    flex: 2;
}

.input-wrapper label {
    font-size: 0.9rem;
    font-weight: 800;
    color: rgba(255,255,255,0.5);
    margin-bottom: 8px;
    letter-spacing: 2px;
}

.glass-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 18px 24px;
    color: #fff;
    font-size: 1.2rem;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    outline: none;
    transition: 0.3s;
}

.glass-input:focus {
    border-color: var(--neon-blue);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.neon-btn {
    background: linear-gradient(45deg, var(--neon-purple), #ff007f);
    color: #fff;
    border: none;
    border-radius: 16px;
    padding: 18px 40px;
    font-size: 1.2rem;
    font-weight: 900;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    transition: 0.3s;
    box-shadow: 0 10px 30px rgba(176, 38, 255, 0.4);
}

.neon-btn:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 15px 40px rgba(176, 38, 255, 0.7);
}

/* КАРТОЧКИ (СЕТКА) */
.max-results {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 30px;
    perspective: 1000px;
}

.mod-card {
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transition: box-shadow 0.3s, border-color 0.3s;
}

.mod-card:hover {
    border-color: var(--neon-blue);
    box-shadow: 0 20px 50px rgba(0, 240, 255, 0.15);
}

/* Декоративная линия внутри карточки */
.mod-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px;
    height: 100%;
    background: var(--neon-green);
    border-radius: 24px 0 0 24px;
}

.mod-card-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    transform: translateZ(30px); /* 3D эффект */
}

.mod-card img {
    width: 70px;
    height: 70px;
    border-radius: 16px;
    image-rendering: pixelated;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.mod-card h3 {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.1;
}

.mod-card p {
    font-size: 1rem;
    color: #aaa;
    flex-grow: 1;
    margin-bottom: 25px;
    font-weight: 300;
    line-height: 1.5;
    transform: translateZ(20px);
}

.download-link {
    display: inline-block;
    text-decoration: none;
    color: var(--bg-dark);
    background: var(--neon-green);
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 800;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: 0.3s;
    transform: translateZ(40px);
}

.download-link:hover {
    background: #fff;
    box-shadow: 0 0 20px var(--neon-green);
}

.status-message {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 2rem;
    font-weight: 900;
    color: rgba(255,255,255,0.2);
    letter-spacing: 5px;
    padding: 50px 0;
}
