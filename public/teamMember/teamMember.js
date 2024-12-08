const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.querySelector('.list');
    const currentPageEl = document.getElementById('currentPage');
    let currentPage = 1; // 현재 페이지 값
    let orderBy = 'upgrade'; // 기본 정렬 방식

    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기
    const email = localStorage.getItem('email');
    console.log('email: ', email);

    // 선수 목록 조회 함수
    const fetchPlayers = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                return;
            }

            // 요청 데이터
            const requestBody = {
                page: currentPage, // 현재 페이지 값
                orderByThis: orderBy || 'name', // 정렬 기준
            };

            console.log('요청 데이터:', requestBody); // 요청 데이터 확인

            const response = await fetch(`/api/myTeamMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, // 인증 토큰
                    'x-info': email, // 헤더에 email 추가
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`요청 실패: ${response.status}`);
            }

            const players = await response.json();
            console.log('응답 데이터:', players); // 응답 데이터 확인
            renderPlayers(players);
        } catch (err) {
            console.error(err.message);
            alert(err.message);
        }
    };

    // 선수 목록 렌더링 함수
    const renderPlayers = (players) => {
        listContainer.innerHTML = players
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
    };

    // 페이지 및 정렬 버튼 이벤트 처리
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            currentPageEl.textContent = currentPage;
            fetchPlayers();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        currentPageEl.textContent = currentPage;
        fetchPlayers();
    });

    document.getElementById('sortByGrade').addEventListener('click', () => {
        orderBy = 'upgrade';
        fetchPlayers();
    });

    document.getElementById('sortByName').addEventListener('click', () => {
        orderBy = 'name';
        fetchPlayers();
    });

    document.getElementById('sortByClub').addEventListener('click', () => {
        orderBy = 'club';
        fetchPlayers();
    });

    document.getElementById('sortByRarity').addEventListener('click', () => {
        orderBy = 'rarity';
        fetchPlayers();
    });

    document
        .getElementById('selectPlayers')
        .addEventListener('click', async () => {
            const playerId1 = document.getElementById('playerId1').value;
            const playerId2 = document.getElementById('playerId2').value;
            const playerId3 = document.getElementById('playerId3').value;

            // 입력값 검증
            if (!playerId1 || !playerId2 || !playerId3) {
                alert('세 개의 선수 ID를 모두 입력해주세요.');
                return;
            }

            try {
                const accessToken = getAccessToken();
                if (!accessToken) {
                    alert('로그인이 필요합니다.');
                    return;
                }

                // `/api/rosterIn`에 요청 보내기
                const response = await fetch('/api/rosterIn', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'x-info': email, // 헤더에 email 추가
                    },
                    body: JSON.stringify({
                        teamMemberId1: parseInt(playerId1, 10),
                        teamMemberId2: parseInt(playerId2, 10),
                        teamMemberId3: parseInt(playerId3, 10),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`요청 실패: ${response.status}`);
                }

                alert('선발된 선수가 저장되었습니다.');
                window.location.href = 'createRoster.html'; // createRoster.html로 이동
            } catch (err) {
                console.error('요청 중 오류 발생:', err.message);
                alert('선수를 저장하는 데 실패했습니다.');
            }
        });

    // 초기 선수 목록 조회
    fetchPlayers();
});
