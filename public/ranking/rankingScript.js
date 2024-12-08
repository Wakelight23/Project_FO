const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../gacha/login/login.html';
}

let itemsPerPage = 10; // 페이지당 항목 수
let currentPage = 1; // 현재 페이지
let startPage = 1; // 시작 페이지 번호
let responseData = null; // API 응답 데이터를 저장할 변수

async function fetchRankings() {
    try {
        const response = await fetch('http://localhost:3002/api/search'); // API 엔드포인트 수정
        if (!response.ok) {
            throw new Error('네트워크 응답이 좋지 않습니다.');
        }
        responseData = await response.json(); // 응답 데이터를 저장
        console.log('Fetched data:', responseData); // 추가된 로그
        displayRankings(responseData.data, currentPage); // 가져온 데이터를 랭킹 표시 함수에 전달
    } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
    }
}

// 랭킹 정보를 표시하는 함수
function displayRankings(data, page) {
    console.log('Displaying rankings for page:', page); // 추가된 로그
    console.log('Data to display:', data); // 추가된 로그
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // 랭킹 데이터가 없는 경우 필터링
    const filteredData = data.filter(
        (manager) => manager.rankings && manager.rankings.length > 0
    );
    const sortedData = filteredData.sort((a, b) => b.rating - a.rating);
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const rankingsDiv = document.getElementById('rankings');
    rankingsDiv.innerHTML = ''; // 기존 내용 초기화

    if (paginatedData.length === 0) {
        rankingsDiv.innerHTML = '<p>랭킹 데이터가 없습니다.</p>'; // 데이터가 없을 경우 메시지 표시
        return;
    }

    paginatedData.forEach((manager) => {
        const { nickname, rating, rankings } = manager;
        const wins = rankings.length > 0 ? rankings[0].win : 0;
        const draws = rankings.length > 0 ? rankings[0].draw : 0;
        const loses = rankings.length > 0 ? rankings[0].lose : 0;

        // 승률 계산
        const totalGames = wins + draws + loses;
        const winRate =
            totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0;

        const managerDiv = document.createElement('div');
        managerDiv.className = 'ranking-item'; // 클래스 추가
        managerDiv.innerHTML = `
            <span class="nickname">${nickname}</span>
            <span class="rating">레이팅: ${rating}</span>
            <span class="win-rate">승률: ${winRate}%</span>
            <span class="score">승: ${wins} | 무: ${draws} | 패: ${loses}</span>
        `;
        rankingsDiv.appendChild(managerDiv);
    });

    updatePagination(filteredData.length, page); // 필터링된 데이터의 총 길이로 페이지네이션 업데이트
}

// 페이지네이션 업데이트 함수
function updatePagination(totalItems, currentPage) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = ''; // 기존 내용 초기화

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 페이지 번호의 시작과 끝 계산
    const endPage = Math.min(startPage + 4, totalPages); // 최대 5개 페이지 표시
    for (let i = startPage; i <= endPage; i++) {
        const pageSpan = document.createElement('span');
        pageSpan.textContent = i;
        pageSpan.onclick = () => {
            currentPage = i;
            displayRankings(responseData.data, currentPage);
            updatePagination(totalItems, currentPage); // 페이지 번호 업데이트
            updateButtonState(currentPage, totalPages); // 버튼 상태 업데이트
        };
        if (i === currentPage) {
            pageSpan.style.fontWeight = 'bold'; // 현재 페이지 강조
        }
        paginationDiv.appendChild(pageSpan);
    }

    // 다음 버튼 추가
    if (endPage < totalPages) {
        const nextButton = document.createElement('span');
        nextButton.textContent = '다음';
        nextButton.onclick = () => {
            startPage += 5; // 다음 5개 페이지로 이동
            updatePagination(totalItems, currentPage); // 페이지 번호 업데이트
        };
        paginationDiv.appendChild(nextButton);
    }

    // 이전 버튼 추가
    if (startPage > 1) {
        const prevButton = document.createElement('span');
        prevButton.textContent = '이전';
        prevButton.onclick = () => {
            startPage -= 5; // 이전 5개 페이지로 이동
            updatePagination(totalItems, currentPage); // 페이지 번호 업데이트
        };
        paginationDiv.insertBefore(prevButton, paginationDiv.firstChild); // 이전 버튼을 맨 앞에 추가
    }
}

// 초기 데이터 표시
fetchRankings(); // 초기 데이터 로드
