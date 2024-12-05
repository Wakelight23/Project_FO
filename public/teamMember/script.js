document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.querySelector('.list');
    const currentPageEl = document.getElementById('currentPage');
    let currentPage = 1; // 현재 페이지 값
    let orderBy = 'name'; // 기본 정렬 방식

    const API_BASE = 'http://localhost:3002';

    const getAccessToken = () => localStorage.getItem('accessToken'); // 토큰 가져오기

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

            const response = await fetch(`${API_BASE}/api/myTeamMember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, // 인증 토큰
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
          <h3>${player.player.name}</h3>
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

    // 페이지 이동 함수
    const updatePage = (direction) => {
        if (direction === 'next') {
            currentPage += 1; // 오른쪽 화살표 클릭 시 증가
        } else if (direction === 'prev' && currentPage > 1) {
            currentPage -= 1; // 왼쪽 화살표 클릭 시 감소
        }
        currentPageEl.textContent = currentPage; // 현재 페이지 값 업데이트
        fetchPlayers(); // 변경된 페이지 값으로 목록 갱신
    };

    // 정렬 버튼 이벤트 리스너
    document.getElementById('sortByName').addEventListener('click', () => {
        orderBy = 'name'; // 이름별 정렬
        fetchPlayers(); // 데이터 재요청
    });

    document.getElementById('sortByClub').addEventListener('click', () => {
        orderBy = 'club'; // 구단별 정렬
        fetchPlayers(); // 데이터 재요청
    });

    document.getElementById('sortByRarity').addEventListener('click', () => {
        orderBy = 'rarity'; // 희귀도별 정렬
        fetchPlayers(); // 데이터 재요청
    });

    document.getElementById('sortByPosition').addEventListener('click', () => {
        orderBy = 'type'; // 포지션별 정렬
        fetchPlayers(); // 데이터 재요청
    });

    // 화살표 버튼 이벤트 리스너
    document.getElementById('nextPage').addEventListener('click', () => {
        updatePage('next');
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        updatePage('prev');
    });

    // 초기 데이터 로드
    fetchPlayers();
});
