document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = 'http://localhost:3002'; // API URL
    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
    const playerIds =
        JSON.parse(localStorage.getItem('selectedPlayerIds')) || []; // 이전 페이지에서 저장한 선수 ID

    // 선수 변경 이벤트
    document
        .getElementById('replaceMember')
        .addEventListener('click', async () => {
            const selectedPlayerId = document.getElementById('playerId1').value; // 선발 선수 ID
            const replacedPlayerId = document.getElementById('playerId2').value; // 교체 선수 ID

            // 입력값 검증
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

                // API 호출
                const response = await fetch(`${API_BASE}/api/rosterOut`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`, // 인증 토큰
                    },
                    body: JSON.stringify({
                        outMemberId: selectedPlayerId, // 교체 대상 선수 ID
                        inMemberId: replacedPlayerId, // 교체 선수 ID
                    }),
                });

                if (!response.ok) {
                    throw new Error(`요청 실패: ${response.status}`);
                }

                const updatedPlayers = await response.json();
                alert('선수 교체가 완료되었습니다.');

                console.log(updatedPlayers);

                // 화면 업데이트
                renderPlayers(updatedPlayers.membersInRoster); // 갱신된 선수 정보 표시
                document.getElementById('teamPower').textContent =
                    updatedPlayers.teamPower; // 예상 점수 갱신
            } catch (err) {
                console.error(err.message);
                alert('선수 교체에 실패했습니다.');
            }
        });

    const fetchSelectedPlayers = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            // 서버로 요청 보내기
            const response = await fetch(`${API_BASE}/api/rosterIn`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    teamMemberId1: playerIds[0],
                    teamMemberId2: playerIds[1],
                    teamMemberId3: playerIds[2],
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
        <p>포지션: ${player.player.type}</p>
      </div>`
            )
            .join('');
    };

    // 데이터 가져오기
    await fetchSelectedPlayers();
});