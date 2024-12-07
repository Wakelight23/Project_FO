document.addEventListener('DOMContentLoaded', async () => {
    // const API_BASE = 'http://localhost:3002';
    const getAccessToken = () => localStorage.getItem('accessToken');
    const playerIds =
        JSON.parse(localStorage.getItem('selectedPlayerIds')) || [];
    const messageBox = document.getElementById('messageBox');
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    // 서버에서 데이터 가져오기
    const fetchData = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            // 아이템 목록 및 선수 정보 가져오기
            const [playersResponse, itemsResponse] = await Promise.all([
                fetch(`/api/equipment/items`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email, // 헤더에 email 추가
                    },
                }),
                fetch(`/api/rosterIn`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email, // 헤더에 email 추가
                    },
                    body: JSON.stringify({
                        teamMemberId1: playerIds[0],
                        teamMemberId2: playerIds[1],
                        teamMemberId3: playerIds[2],
                    }),
                }),
            ]);

            if (!playersResponse.ok || !itemsResponse.ok) {
                throw new Error('데이터를 가져오는데 실패했습니다.');
            }

            const playersData = await itemsResponse.json();
            const itemsData = await playersResponse.json();

            renderPlayers(playersData.players);
            renderItems(itemsData.data);
        } catch (err) {
            console.error(err.message);
            alert('데이터 로드 중 오류가 발생했습니다.');
        }
    };

    // 선수 카드 렌더링
    const renderPlayers = (players) => {
        const container = document.getElementById('selectedPlayersContainer');
        container.innerHTML = players
            .map(
                (player) => `
          <div class="player-card">
              <h3>${player.player.name}</h3>
              <p>ID: ${player.teamMemberId}</p>
              <p>속도: ${player.player.speed}</p>
              <p>골결정력: ${player.player.goalFinishing}</p>
              <p>수비력: ${player.player.defense}</p>
              <p>체력: ${player.player.stamina}</p>
              <select id="itemSelect-${player.teamMemberId}">
                  <option value="">아이템 선택</option>
              </select>
          </div>
      `
            )
            .join('');
    };

    // 아이템 카드 렌더링
    const renderItems = (items) => {
        items.forEach((item) => {
            const select = document.getElementById(
                `itemSelect-${item.teamMemberId}`
            );
            if (select) {
                const option = document.createElement('option');
                option.value = item.itemId;
                option.textContent = `${item.name} (속도: ${item.stats.speed})`;
                select.appendChild(option);
            }
        });
    };

    // 아이템 장착 이벤트
    document
        .getElementById('equipItemsButton')
        .addEventListener('click', async () => {
            const itemIds = [];
            const teamMemberIds = [];

            // 각 선수별 선택된 아이템 수집
            playerIds.forEach((id) => {
                const select = document.getElementById(`itemSelect-${id}`);
                if (select && select.value) {
                    itemIds.push(select.value);
                    teamMemberIds.push(id);
                }
            });

            // 유효성 검사
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
                        'x-info': email, // 헤더에 email 추가
                    },
                    body: JSON.stringify({
                        itemIds,
                        teamMemberIds,
                    }),
                });

                if (!response.ok) {
                    throw new Error('아이템 장착에 실패했습니다.');
                }

                const data = await response.json();
                messageBox.textContent = '아이템이 성공적으로 장착되었습니다!';
                messageBox.style.color = 'green';
            } catch (err) {
                console.error(err.message);
                messageBox.textContent = '아이템 장착 중 오류가 발생했습니다.';
                messageBox.style.color = 'red';
            }
        });

    fetchData();
});