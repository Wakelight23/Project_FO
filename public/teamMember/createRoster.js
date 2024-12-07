document.addEventListener('DOMContentLoaded', async () => {
    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    const renderPlayers = (players) => {
        const container = document.querySelector('.selected-players');
        container.innerHTML = players
            .map(
                (player) => `
      <div class="player-card">
        <h3>${player.player.name}</h3>
        <p>ID: ${player.teamMemberId}</p>
        <p>구단: ${player.player.club}</p>
        <p>속도: ${player.player.speed}</p>
        <p>골결정력: ${player.player.goalFinishing}</p>
        <p>슛파워: ${player.player.shootPower}</p>
        <p>수비력: ${player.player.defense}</p>
        <p>체력: ${player.player.stamina}</p>
        <p>희귀도: ${player.player.rarity}</p>
        <p>등급: ${player.upgrade}</p>
      </div>`
            )
            .join('');
    };

    const updateSelectedPlayerIds = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('/api/upgrade', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`요청 실패: ${response.status}`);
            }

            const players = await response.json();
            renderPlayers(players);
            console.log('선수 목록 갱신 완료:', players);
        } catch (err) {
            console.error(err.message);
            alert('선수 목록을 갱신하는 데 실패했습니다.');
        }
    };

    const fetchSelectedPlayers = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`/api/rosterIn`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    'x-info': email,
                },
                body: JSON.stringify({
                    teamMemberId1: 1, // 예제 데이터
                    teamMemberId2: 2,
                    teamMemberId3: 3,
                }),
            });

            if (!response.ok) {
                throw new Error(`요청 실패: ${response.status}`);
            }

            const { players, teamPower } = await response.json();
            renderPlayers(players);
            document.getElementById('teamPower').textContent = teamPower; // 예상 점수 표시
        } catch (err) {
            console.error(err.message);
            alert('선수를 불러오는 데 실패했습니다.');
        }
    };

    document
        .getElementById('replaceMember')
        .addEventListener('click', async () => {
            const selectedPlayerId = document.getElementById('playerId1').value; // 선발 선수 ID
            const replacedPlayerId = document.getElementById('playerId2').value; // 교체 선수 ID

            if (!selectedPlayerId || !replacedPlayerId) {
                alert('선수 ID를 모두 입력해주세요.');
                return;
            }

            try {
                const accessToken = getAccessToken();
                if (!accessToken) {
                    alert('로그인이 필요합니다.');
                    return;
                }

                const response = await fetch(`/api/rosterOut`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email,
                    },
                    body: JSON.stringify({
                        outMemberId: parseInt(selectedPlayerId, 10),
                        inMemberId: parseInt(replacedPlayerId, 10),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`요청 실패: ${response.status}`);
                }

                const updatedPlayers = await response.json();
                alert('선수 교체가 완료되었습니다.');
                await updateSelectedPlayerIds(); // 선수 목록 갱신
                renderPlayers(updatedPlayers.membersInRoster);
                document.getElementById('teamPower').textContent =
                    updatedPlayers.teamPower; // 예상 점수 갱신
            } catch (err) {
                console.error(err.message);
                alert('선수 교체에 실패했습니다.');
            }
        });

    await fetchSelectedPlayers();
});
