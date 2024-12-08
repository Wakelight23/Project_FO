const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

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

        playerContainer.innerHTML = players
            .map((player) => {
                const playerItems = items.filter(
                    (item) => item.managerId === player.managerId
                );
                return `
                <div class="player-card">
                    <img src=${player.player.playerImage || 'https://img.freepik.com/free-photo/soccer-game-concept_23-2151043855.jpg?ga=GA1.1.822806027.1732811017&semt=ais_hybrid'} width="200" height="250">
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
                                        `<option value="${item.itemId}">${item.name} (속도: ${item.stats.speed}, 골결정력: ${item.stats.goalFinishing}, 수비력: ${item.stats.defense}, 체력: ${item.stats.stamina}, 희귀도: ${item.stats.rarity})</option>`
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

                alert('아이템 장착이 성공적으로 완료되었습니다!');
                window.location.href = 'equippedItems.html';
            } catch (err) {
                console.error('에러 발생:', err.message);
                alert(`에러 발생: ${err.message}`);
            }
        });

    fetchData();
});
