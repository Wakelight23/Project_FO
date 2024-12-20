const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // const API_BASE = 'http://localhost:3002'; // API Base URL
    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    // 강화 가능한 선수 조회
    const fetchUpgradeablePlayers = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`/api/upgrade`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`, // 인증 토큰
                    'x-info': email, // 헤더에 email 추가
                },
            });

            if (!response.ok) {
                throw new Error(`요청 실패: ${response.status}`);
            }

            const players = await response.json();
            renderUpgradeablePlayers(players);
        } catch (err) {
            console.error(err.message);
            alert('강화 가능한 선수를 가져오는 데 실패했습니다.');
        }
    };

    // 강화 가능한 선수 목록 렌더링
    const renderUpgradeablePlayers = (players) => {
        const container = document.getElementById('upgradeable-players');
        if (players.length === 0) {
            container.innerHTML = '<p>강화 가능한 선수가 없습니다.</p>';
            return;
        }

        container.innerHTML = players
            .map(
                (player) => `
          <div class="player-card">
              <img src=${player.player.playerImage || 'https://img.freepik.com/free-photo/soccer-game-concept_23-2151043855.jpg?ga=GA1.1.822806027.1732811017&semt=ais_hybrid'} width="200" height="250">
              <h3>${player.player.name}</h3>
              <p>ID: ${player.teamMemberId}</p>
              <p>구단: ${player.player.club}</p>
              <p>현재 등급: ${player.upgrade}</p>
          </div>`
            )
            .join('');
    };

    // 선수 강화 시도
    document
        .getElementById('upgradeButton')
        .addEventListener('click', async () => {
            const memberIdToUpg =
                document.getElementById('memberIdToUpg').value;
            const memberIdToSac =
                document.getElementById('memberIdToSac').value;

            // 입력값 검증
            if (!memberIdToUpg || !memberIdToSac) {
                alert('강화할 선수와 재료 선수를 모두 입력하세요.');
                return;
            }

            try {
                const accessToken = getAccessToken();
                if (!accessToken) {
                    alert('로그인이 필요합니다.');
                    return;
                }

                const response = await fetch(`/api/upgrade`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`, // 인증 토큰
                        'x-info': email, // 헤더에 email 추가
                    },
                    body: JSON.stringify({
                        memberIdToUpg: parseInt(memberIdToUpg, 10),
                        memberIdToSac: parseInt(memberIdToSac, 10),
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || '강화 실패');
                }

                alert(result.message);
                document.getElementById('message').textContent = result.message;
                fetchUpgradeablePlayers(); // 목록 갱신
            } catch (err) {
                console.error(err.message);
                alert('강화에 실패했습니다.');
            }
        });

    // 데이터 가져오기
    fetchUpgradeablePlayers();
});
