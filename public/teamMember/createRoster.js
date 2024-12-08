document.addEventListener('DOMContentLoaded', async () => {
    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
    const email = localStorage.getItem('email'); // 이메일 가져오기
    console.log('email: ', email); // 디버깅용 로그

    // 예상 점수를 계산하는 함수
    function calculateTeamPower(players) {
        return players.reduce((total, player) => {
            return (
                total +
                player.player.speed +
                player.player.goalFinishing +
                player.player.shootPower
            );
        }, 0);
    }

    // 선수 데이터를 화면에 렌더링하는 함수
    function renderPlayers(players) {
        const container = document.querySelector('.selected-players');
        container.innerHTML = players
            .map(
                (player) => `
                <div class="player-card">
                    <img src=${player.player.playerImage || 'https://img.freepik.com/free-photo/soccer-game-concept_23-2151043855.jpg?ga=GA1.1.822806027.1732811017&semt=ais_hybrid'} width="200" height="250">
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
    }

    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html'; // 로그인 페이지로 리디렉션
            return;
        }

        // `/api/roster`에 GET 요청 보내기
        const response = await fetch('/api/roster', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-info': email, // 헤더에 이메일 추가
            },
        });

        if (!response.ok) {
            throw new Error(`요청 실패: ${response.status}`);
        }

        const players = await response.json();
        console.log('선택된 선수 목록:', players); // 서버에서 받은 선수 데이터 디버깅

        // 화면에 데이터 렌더링
        renderPlayers(players);

        // 예상 점수 계산 및 업데이트
        const teamPower = calculateTeamPower(players);
        document.getElementById('teamPower').textContent = teamPower;
    } catch (err) {
        console.error('데이터 요청 중 오류 발생:', err.message);
        alert('선수를 불러오는 데 실패했습니다.');
    }

    // 선수 교체 기능
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

                // 화면 데이터 갱신
                renderPlayers(updatedPlayers.membersInRoster);
                document.getElementById('teamPower').textContent =
                    updatedPlayers.teamPower; // 예상 점수 갱신
            } catch (err) {
                console.error(err.message);
                alert('선수 교체에 실패했습니다.');
            }
        });
});
