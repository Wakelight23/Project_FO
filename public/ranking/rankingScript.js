// 예시 JSON 데이터
const responseData = {
    "data": [
        { "nickname": "매니저1", "rating": 1500, "rankings": [{ "win": 10, "draw": 5, "lose": 2 }] },
        { "nickname": "매니저2", "rating": 1480, "rankings": [{ "win": 9, "draw": 6, "lose": 2 }] },
        { "nickname": "매니저3", "rating": 1475, "rankings": [{ "win": 8, "draw": 7, "lose": 2 }] },
        { "nickname": "매니저4", "rating": 1460, "rankings": [{ "win": 10, "draw": 3, "lose": 4 }] },
        { "nickname": "매니저5", "rating": 1450, "rankings": [{ "win": 7, "draw": 8, "lose": 2 }] },
        { "nickname": "매니저6", "rating": 1445, "rankings": [{ "win": 6, "draw": 9, "lose": 3 }] },
        { "nickname": "매니저7", "rating": 1440, "rankings": [{ "win": 5, "draw": 10, "lose": 3 }] },
        { "nickname": "매니저8", "rating": 1435, "rankings": [{ "win": 4, "draw": 11, "lose": 3 }] },
        { "nickname": "매니저9", "rating": 1430, "rankings": [{ "win": 3, "draw": 12, "lose": 3 }] },
        { "nickname": "매니저10", "rating": 1425, "rankings": [{ "win": 2, "draw": 13, "lose": 3 }] },
        { "nickname": "매니저11", "rating": 1420, "rankings": [{ "win": 1, "draw": 14, "lose": 3 }] },
        { "nickname": "매니저12", "rating": 1415, "rankings": [{ "win": 0, "draw": 15, "lose": 3 }] },
        { "nickname": "매니저13", "rating": 1410, "rankings": [{ "win": 10, "draw": 4, "lose": 1 }] },
        { "nickname": "매니저14", "rating": 1405, "rankings": [{ "win": 9, "draw": 5, "lose": 1 }] },
        { "nickname": "매니저15", "rating": 1400, "rankings": [{ "win": 8, "draw": 6, "lose": 1 }] },
        { "nickname": "매니저16", "rating": 1395, "rankings": [{ "win": 7, "draw": 7, "lose": 1 }] },
        { "nickname": "매니저17", "rating": 1390, "rankings": [{ "win": 6, "draw": 8, "lose": 1 }] },
        { "nickname": "매니저18", "rating": 1385, "rankings": [{ "win": 5, "draw": 9, "lose": 1 }] },
        { "nickname": "매니저19", "rating": 1380, "rankings": [{ "win": 4, "draw": 10, "lose": 1 }] },
        { "nickname": "매니저20", "rating": 1375, "rankings": [{ "win": 3, "draw": 11, "lose": 1 }] },
        { "nickname": "매니저21", "rating": 1370, "rankings": [{ "win": 2, "draw": 12, "lose": 1 }] },
        { "nickname": "매니저22", "rating": 1365, "rankings": [{ "win": 1, "draw": 13, "lose": 1 }] },
        { "nickname": "매니저23", "rating": 1360, "rankings": [{ "win": 0, "draw": 14, "lose": 1 }] },
        { "nickname": "매니저24", "rating": 1355, "rankings": [{ "win": 10, "draw": 3, "lose": 2 }] },
        { "nickname": "매니저25", "rating": 1350, "rankings": [{ "win": 9, "draw": 4, "lose": 2 }] },
        { "nickname": "매니저26", "rating": 1345, "rankings": [{ "win": 8, "draw": 5, "lose": 2 }] },
        { "nickname": "매니저27", "rating": 1340, "rankings": [{ "win": 7, "draw": 6, "lose": 2 }] },
        { "nickname": "매니저28", "rating": 1335, "rankings": [{ "win": 6, "draw": 7, "lose": 2 }] },
        { "nickname": "매니저29", "rating": 1330, "rankings": [{ "win": 5, "draw": 8, "lose": 2 }] },
        { "nickname": "매니저30", "rating": 1325, "rankings": [{ "win": 4, "draw": 9, "lose": 2 }] },
        { "nickname": "매니저31", "rating": 1320, "rankings": [{ "win": 3, "draw": 10, "lose": 2 }] },
        { "nickname": "매니저32", "rating": 1315, "rankings": [{ "win": 2, "draw": 11, "lose": 2 }] },
        { "nickname": "매니저33", "rating": 1310, "rankings": [{ "win": 1, "draw": 12, "lose": 2 }] },
        { "nickname": "매니저34", "rating": 1305, "rankings": [{ "win": 0, "draw": 13, "lose": 2 }] },
        { "nickname": "매니저35", "rating": 1300, "rankings": [{ "win": 10, "draw": 2, "lose": 3 }] },
        { "nickname": "매니저36", "rating": 1295, "rankings": [{ "win": 9, "draw": 3, "lose": 3 }] },
        { "nickname": "매니저37", "rating": 1290, "rankings": [{ "win": 8, "draw": 4, "lose": 3 }] },
        { "nickname": "매니저38", "rating": 1285, "rankings": [{ "win": 7, "draw": 5, "lose": 3 }] },
        { "nickname": "매니저39", "rating": 1280, "rankings": [{ "win": 6, "draw": 6, "lose": 3 }] },
        { "nickname": "매니저40", "rating": 1275, "rankings": [{ "win": 5, "draw": 7, "lose": 3 }] },
        { "nickname": "매니저41", "rating": 1270, "rankings": [{ "win": 4, "draw": 8, "lose": 3 }] },
        { "nickname": "매니저42", "rating": 1265, "rankings": [{ "win": 3, "draw": 9, "lose": 3 }] },
        { "nickname": "매니저43", "rating": 1260, "rankings": [{ "win": 2, "draw": 10, "lose": 3 }] },
        { "nickname": "매니저44", "rating": 1255, "rankings": [{ "win": 1, "draw": 11, "lose": 3 }] },
        { "nickname": "매니저45", "rating": 1250, "rankings": [{ "win": 0, "draw": 12, "lose": 3 }] },
        { "nickname": "매니저46", "rating": 1245, "rankings": [{ "win": 10, "draw": 1, "lose": 4 }] },
        { "nickname": "매니저47", "rating": 1240, "rankings": [{ "win": 9, "draw": 2, "lose": 4 }] },
        { "nickname": "매니저48", "rating": 1235, "rankings": [{ "win": 8, "draw": 3, "lose": 4 }] },
        { "nickname": "매니저49", "rating": 1230, "rankings": [{ "win": 7, "draw": 4, "lose": 4 }] },
        { "nickname": "매니저50", "rating": 1225, "rankings": [{ "win": 6, "draw": 5, "lose": 4 }] },
        { "nickname": "매니저51", "rating": 1220, "rankings": [{ "win": 5, "draw": 6, "lose": 4 }] },
        { "nickname": "매니저52", "rating": 1215, "rankings": [{ "win": 4, "draw": 7, "lose": 4 }] },
        { "nickname": "매니저53", "rating": 1210, "rankings": [{ "win": 3, "draw": 8, "lose": 4 }] },
        { "nickname": "매니저54", "rating": 1205, "rankings": [{ "win": 2, "draw": 9, "lose": 4 }] },
        { "nickname": "매니저55", "rating": 1200, "rankings": [{ "win": 1, "draw": 10, "lose": 4 }] },
        { "nickname": "매니저56", "rating": 1195, "rankings": [{ "win": 0, "draw": 11, "lose": 4 }] },
        { "nickname": "매니저57", "rating": 1190, "rankings": [{ "win": 10, "draw": 0, "lose": 5 }] },
        { "nickname": "매니저58", "rating": 1185, "rankings": [{ "win": 9, "draw": 1, "lose": 5 }] },
        { "nickname": "매니저59", "rating": 1180, "rankings": [{ "win": 8, "draw": 2, "lose": 5 }] },
        { "nickname": "매니저60", "rating": 1175, "rankings": [{ "win": 7, "draw": 3, "lose": 5 }] },
        { "nickname": "매니저61", "rating": 1170, "rankings": [{ "win": 6, "draw": 4, "lose": 5 }] },
        { "nickname": "매니저62", "rating": 1165, "rankings": [{ "win": 5, "draw": 5, "lose": 5 }] },
        { "nickname": "매니저63", "rating": 1160, "rankings": [{ "win": 4, "draw": 6, "lose": 5 }] },
        { "nickname": "매니저64", "rating": 1155, "rankings": [{ "win": 3, "draw": 7, "lose": 5 }] },
        { "nickname": "매니저65", "rating": 1150, "rankings": [{ "win": 2, "draw": 8, "lose": 5 }] },
        { "nickname": "매니저66", "rating": 1145, "rankings": [{ "win": 1, "draw": 9, "lose": 5 }] },
        { "nickname": "매니저67", "rating": 1140, "rankings": [{ "win": 0, "draw": 10, "lose": 5 }] },
        { "nickname": "매니저68", "rating": 1135, "rankings": [{ "win": 10, "draw": 0, "lose": 6 }] },
        { "nickname": "매니저69", "rating": 1130, "rankings": [{ "win": 9, "draw": 1, "lose": 6 }] },
        { "nickname": "매니저70", "rating": 1125, "rankings": [{ "win": 8, "draw": 2, "lose": 6 }] },
        { "nickname": "매니저71", "rating": 1120, "rankings": [{ "win": 7, "draw": 3, "lose": 6 }] },
        { "nickname": "매니저72", "rating": 1115, "rankings": [{ "win": 6, "draw": 4, "lose": 6 }] },
        { "nickname": "매니저73", "rating": 1110, "rankings": [{ "win": 5, "draw": 5, "lose": 6 }] },
        { "nickname": "매니저74", "rating": 1105, "rankings": [{ "win": 4, "draw": 6, "lose": 6 }] },
        { "nickname": "매니저75", "rating": 1100, "rankings": [{ "win": 3, "draw": 7, "lose": 6 }] },
        { "nickname": "매니저76", "rating": 1095, "rankings": [{ "win": 2, "draw": 8, "lose": 6 }] },
        { "nickname": "매니저77", "rating": 1090, "rankings": [{ "win": 1, "draw": 9, "lose": 6 }] },
        { "nickname": "매니저78", "rating": 1085, "rankings": [{ "win": 0, "draw": 10, "lose": 6 }] },
        { "nickname": "매니저79", "rating": 1080, "rankings": [{ "win": 10, "draw": 0, "lose": 7 }] },
        { "nickname": "매니저80", "rating": 1075, "rankings": [{ "win": 9, "draw": 1, "lose": 7 }] },
        { "nickname": "매니저81", "rating": 1070, "rankings": [{ "win": 8, "draw": 2, "lose": 7 }] },
        { "nickname": "매니저82", "rating": 1065, "rankings": [{ "win": 7, "draw": 3, "lose": 7 }] },
        { "nickname": "매니저83", "rating": 1060, "rankings": [{ "win": 6, "draw": 4, "lose": 7 }] },
        { "nickname": "매니저84", "rating": 1055, "rankings": [{ "win": 5, "draw": 5, "lose": 7 }] },
        { "nickname": "매니저85", "rating": 1050, "rankings": [{ "win": 4, "draw": 6, "lose": 7 }] },
        { "nickname": "매니저86", "rating": 1045, "rankings": [{ "win": 3, "draw": 7, "lose": 7 }] },
        { "nickname": "매니저87", "rating": 1040, "rankings": [{ "win": 2, "draw": 8, "lose": 7 }] },
        { "nickname": "매니저88", "rating": 1035, "rankings": [{ "win": 1, "draw": 9, "lose": 7 }] },
        { "nickname": "매니저89", "rating": 1030, "rankings": [{ "win": 0, "draw": 10, "lose": 7 }] },
        { "nickname": "매니저90", "rating": 1025, "rankings": [{ "win": 10, "draw": 0, "lose": 8 }] },
        { "nickname": "매니저91", "rating": 1020, "rankings": [{ "win": 9, "draw": 1, "lose": 8 }] },
        { "nickname": "매니저92", "rating": 1015, "rankings": [{ "win": 8, "draw": 2, "lose": 8 }] },
        { "nickname": "매니저93", "rating": 1010, "rankings": [{ "win": 7, "draw": 3, "lose": 8 }] },
        { "nickname": "매니저94", "rating": 1005, "rankings": [{ "win": 6, "draw": 4, "lose": 8 }] },
        { "nickname": "매니저95", "rating": 1000, "rankings": [{ "win": 5, "draw": 5, "lose": 8 }] },
        { "nickname": "매니저96", "rating": 995, "rankings": [{ "win": 4, "draw": 6, "lose": 8 }] },
        { "nickname": "매니저97", "rating": 990, "rankings": [{ "win": 3, "draw": 7, "lose": 8 }] },
        { "nickname": "매니저98", "rating": 985, "rankings": [{ "win": 2, "draw": 8, "lose": 8 }] },
        { "nickname": "매니저99", "rating": 980, "rankings": [{ "win": 1, "draw": 9, "lose": 8 }] },
        { "nickname": "매니저100", "rating": 975, "rankings": [{ "win": 0, "draw": 10, "lose": 8 }] },
        { "nickname": "매니저101", "rating": 970, "rankings": [{ "win": 0, "draw": 11, "lose": 8 }] },
        { "nickname": "매니저102", "rating": 965, "rankings": [{ "win": 1, "draw": 10, "lose": 8 }] },
        { "nickname": "매니저103", "rating": 960, "rankings": [{ "win": 2, "draw": 9, "lose": 8 }] },
        { "nickname": "매니저104", "rating": 955, "rankings": [{ "win": 3, "draw": 8, "lose": 8 }] },
        { "nickname": "매니저105", "rating": 950, "rankings": [{ "win": 4, "draw": 7, "lose": 8 }] },
        { "nickname": "매니저106", "rating": 945, "rankings": [{ "win": 5, "draw": 6, "lose": 8 }] },
        { "nickname": "매니저107", "rating": 940, "rankings": [{ "win": 6, "draw": 5, "lose": 8 }] },
        { "nickname": "매니저108", "rating": 935, "rankings": [{ "win": 7, "draw": 4, "lose": 8 }] },
        { "nickname": "매니저109", "rating": 930, "rankings": [{ "win": 8, "draw": 3, "lose": 8 }] },
        { "nickname": "매니저110", "rating": 925, "rankings": [{ "win": 9, "draw": 2, "lose": 8 }] },
        { "nickname": "매니저111", "rating": 920, "rankings": [{ "win": 10, "draw": 1, "lose": 8 }] },
        { "nickname": "매니저112", "rating": 915, "rankings": [{ "win": 11, "draw": 0, "lose": 8 }] },
        { "nickname": "매니저113", "rating": 910, "rankings": [{ "win": 10, "draw": 1, "lose": 9 }] },
        { "nickname": "매니저114", "rating": 905, "rankings": [{ "win": 9, "draw": 2, "lose": 9 }] },
        { "nickname": "매니저115", "rating": 900, "rankings": [{ "win": 8, "draw": 3, "lose": 9 }] },
        { "nickname": "매니저116", "rating": 895, "rankings": [{ "win": 7, "draw": 4, "lose": 9 }] },
        { "nickname": "매니저117", "rating": 890, "rankings": [{ "win": 6, "draw": 5, "lose": 9 }] },
        { "nickname": "매니저118", "rating": 885, "rankings": [{ "win": 5, "draw": 6, "lose": 9 }] },
        { "nickname": "매니저119", "rating": 880, "rankings": [{ "win": 4, "draw": 7, "lose": 9 }] },
        { "nickname": "매니저120", "rating": 875, "rankings": [{ "win": 3, "draw": 8, "lose": 9 }] },
        { "nickname": "매니저121", "rating": 870, "rankings": [{ "win": 2, "draw": 9, "lose": 9 }] },
        { "nickname": "매니저122", "rating": 865, "rankings": [{ "win": 1, "draw": 10, "lose": 9 }] },
        { "nickname": "매니저123", "rating": 860, "rankings": [{ "win": 0, "draw": 11, "lose": 9 }] },
        { "nickname": "매니저124", "rating": 855, "rankings": [{ "win": 0, "draw": 12, "lose": 9 }] },
        { "nickname": "매니저125", "rating": 850, "rankings": [{ "win": 1, "draw": 11, "lose": 9 }] },
        { "nickname": "매니저126", "rating": 845, "rankings": [{ "win": 2, "draw": 10, "lose": 9 }] },
        { "nickname": "매니저127", "rating": 840, "rankings": [{ "win": 3, "draw": 9, "lose": 9 }] },
        { "nickname": "매니저128", "rating": 835, "rankings": [{ "win": 4, "draw": 8, "lose": 9 }] },
        { "nickname": "매니저129", "rating": 830, "rankings": [{ "win": 5, "draw": 7, "lose": 9 }] },
        { "nickname": "매니저130", "rating": 825, "rankings": [{ "win": 6, "draw": 6, "lose": 9 }] }
    ]
};

let itemsPerPage = 10; // 페이지당 항목 수
let currentPage = 1; // 현재 페이지
let startPage = 1; // 시작 페이지 번호

// 랭킹 정보를 표시하는 함수
function displayRankings(data, page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const sortedData = data.sort((a, b) => b.rating - a.rating);
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const rankingsDiv = document.getElementById('rankings');
    rankingsDiv.innerHTML = ''; // 기존 내용 초기화

    paginatedData.forEach(manager => {
        const { nickname, rating, rankings } = manager;
        const wins = rankings.length > 0 ? rankings[0].win : 0;
        const draws = rankings.length > 0 ? rankings[0].draw : 0;
        const loses = rankings.length > 0 ? rankings[0].lose : 0;

        // 승률 계산
        const totalGames = wins + draws + loses;
        const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0;

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

    updatePagination(data.length, page);
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
displayRankings(responseData.data, currentPage);
