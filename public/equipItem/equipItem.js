document.addEventListener('DOMContentLoaded', async () => {
    const getAccessToken = () => localStorage.getItem('accessToken');
    const messageBox = document.getElementById('messageBox');
    const email = localStorage.getItem('email');

    console.log('email: ', email);

    // 데이터 가져오기
    const fetchData = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            // `/api/equipment/items`와 `/api/roster` 데이터 가져오기
            const [itemsResponse, playersResponse] = await Promise.all([
                fetch(`/api/equipment/items`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email,
                    },
                }),
                fetch(`/api/roster`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email,
                    },
                }),
            ]);

            if (!itemsResponse.ok || !playersResponse.ok) {
                throw new Error('데이터를 가져오는데 실패했습니다.');
            }

            const itemsData = await itemsResponse.json();
            const playersData = await playersResponse.json();

            console.log('선수 데이터:', playersData);

            // 데이터가 배열인지 확인하고 처리
            const players = Array.isArray(playersData) ? playersData : [];
            const items = itemsData?.data || [];

            console.log('아이템 데이터:', items);

            if (players.length === 0) {
                console.error('선수 데이터가 비어있습니다.');
                throw new Error('선수 데이터를 불러오지 못했습니다.');
            }

            render(players, items);
        } catch (err) {
            console.error('fetchData 에러:', err.message);
            alert(err.message);
        }
    };

    // 렌더링 함수
    const render = (players, items) => {
        const playerContainer = document.getElementById(
            'selectedPlayersContainer'
        );

        // 선수와 아이템 렌더링
        playerContainer.innerHTML = players
            .map((player) => {
                const playerItems = items.filter(
                    (item) => item.managerId === player.managerId
                );
                return `
                <div class="player-card">
                    <h3>${player.player?.name || 'Unknown'}</h3>
                    <p>ID: ${player.teamMemberId}</p>
                    <p>속도: ${player.player?.speed || 'N/A'}</p>
                    <p>골결정력: ${player.player?.goalFinishing || 'N/A'}</p>
                    <p>수비력: ${player.player?.defense || 'N/A'}</p>
                    <p>체력: ${player.player?.stamina || 'N/A'}</p>
                    <select id="itemSelect-${player.teamMemberId}">
                        <option value="">아이템 선택</option>
                        ${
                            playerItems
                                .map(
                                    (item) =>
                                        `<option value="${item.itemId}">${item.name} (속도: ${item.stats.speed}, 희귀도: ${item.stats.rarity})</option>`
                                )
                                .join('') ||
                            '<option disabled>아이템 없음</option>'
                        }
                    </select>
                </div>`;
            })
            .join('');
    };

    // 아이템 장착 처리
    document
        .getElementById('equipItemsButton')
        .addEventListener('click', async () => {
            const itemIds = [];
            const teamMemberIds = [];

            // 선택된 아이템과 선수 ID 수집
            const playerCards = document.querySelectorAll(
                '.player-card select'
            );
            playerCards.forEach((select) => {
                if (select && select.value) {
                    const teamMemberId = select.id.replace('itemSelect-', '');
                    itemIds.push(select.value);
                    teamMemberIds.push(teamMemberId);
                }
            });

            if (itemIds.length !== 3 || teamMemberIds.length !== 3) {
                alert('3명의 선수와 3개의 아이템을 선택해야 합니다.');
                return;
            }

            try {
                const accessToken = getAccessToken();
                const response = await fetch(`/api/equipment/equip`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email,
                    },
                    body: JSON.stringify({ itemIds, teamMemberIds }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || '아이템 장착에 실패했습니다.'
                    );
                }

                const data = await response.json();
                messageBox.textContent = '아이템이 성공적으로 장착되었습니다!';
                messageBox.style.color = 'green';
            } catch (err) {
                console.error(err.message);
                messageBox.textContent = err.message;
                messageBox.style.color = 'red';
            }
        });

    document
        .getElementById('equipItemsButton')
        .addEventListener('click', () => {
            // 아이템 장착 로직 처리 후 equippedItems.html로 이동
            window.location.href = 'equippedItems.html';
        });

    fetchData();
});
