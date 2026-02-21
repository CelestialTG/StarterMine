document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const versionSelect = document.getElementById('version-select');
    const loaderSelect = document.getElementById('loader-select');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');

    searchBtn.addEventListener('click', () => {
        fetchMods();
    });

    // Поиск по нажатию Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchMods();
        }
    });

    async function fetchMods() {
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        const query = searchInput.value;

        // Показываем индикатор загрузки
        resultsContainer.innerHTML = '<div class="mc-message">Ищем алмазы... (Загрузка)</div>';

        try {
            // Формируем фильтры (facets) для API Modrinth
            // 1. Версия игры
            // 2. Загрузчик (Fabric, Forge и т.д.)
            // 3. Тип проекта: только моды и плагины (исключаем датапаки и ресурспаки)
            const facets = [
                [`versions:${version}`],
                [`categories:${loader}`],
                ["project_type:mod", "project_type:plugin"]
            ];

            const url = new URL('https://api.modrinth.com/v2/search');
            url.searchParams.append('query', query);
            url.searchParams.append('facets', JSON.stringify(facets));
            url.searchParams.append('limit', 20); // Загружаем 20 штук за раз

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Ошибка связи с сервером Modrinth');
            }

            const data = await response.json();
            displayResults(data.hits);

        } catch (error) {
            resultsContainer.innerHTML = `<div class="mc-message" style="color: #ff5555;">Ошибка: ${error.message}</div>`;
        }
    }

    function displayResults(mods) {
        resultsContainer.innerHTML = '';

        if (mods.length === 0) {
            resultsContainer.innerHTML = '<div class="mc-message">Ничего не найдено. Попробуйте изменить фильтры.</div>';
            return;
        }

        mods.forEach(mod => {
            // Создаем карточку мода
            const card = document.createElement('div');
            card.className = 'mc-card';

            const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg'; // Иконка по умолчанию
            const modTitle = mod.title;
            const modDesc = mod.description.length > 80 ? mod.description.substring(0, 80) + '...' : mod.description;
            const modLink = `https://modrinth.com/${mod.project_type}/${mod.slug}`; // Ссылка на скачивание

            card.innerHTML = `
                <img src="${iconUrl}" alt="${modTitle} icon">
                <h3>${modTitle}</h3>
                <p>${modDesc}</p>
                <a href="${modLink}" target="_blank">Скачать</a>
            `;

            resultsContainer.appendChild(card);
        });
    }
});
