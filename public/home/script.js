// 로그인 상태를 확인하는 함수
function checkLoginStatus() {
    // 로컬 스토리지에서 토큰과 저장된 시간 가져오기
    const token = localStorage.getItem('accessToken');
    const tokenTime = localStorage.getItem('tokenTime');

    // 현재 시간
    const currentTime = new Date().getTime();

    // 만료 시간 (5분 = 300000ms)
    const expirationTime = 300000; // 5분

    // 토큰이 존재하고, 만료 시간이 지나지 않았는지 확인
    const isLoggedIn = token && currentTime - tokenTime < expirationTime;
    const authLinks = document.getElementById('authLinks');

    if (isLoggedIn) {
        // 로그인된 경우
        const managerNickname =
            localStorage.getItem('managerNickname') || '매니저'; // 매니저 닉네임 가져오기
        const cash = localStorage.getItem('cash') || 0; // 캐쉬 정보 가져오기
        authLinks.innerHTML = `
            <span>${managerNickname} (캐쉬: ${cash})</span>
            <a href="manager-page.html">매니저 페이지</a>
        `;
    }
}

// 페이지가 로드될 때 로그인 상태 확인
window.onload = checkLoginStatus;

// 로그인 시 호출할 함수 (예시)
function login() {
    // 로그인 성공 시
    const accessToken = 'your_access_token'; // 실제 토큰으로 대체
    const managerNickname = '사용자닉네임'; // 실제 닉네임으로 대체
    const cash = 100; // 초기 캐쉬 값

    // 로컬 스토리지에 토큰과 시간 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('tokenTime', new Date().getTime());
    localStorage.setItem('managerNickname', managerNickname);
    localStorage.setItem('cash', cash);

    // 페이지 새로고침 또는 헤더 업데이트
    checkLoginStatus();
}

// 게임 시작 버튼 클릭 이벤트 추가
document.getElementById('playButton').addEventListener('click', () => {
    alert('게임이 시작됩니다!');
    // 여기에 게임 시작 로직을 추가할 수 있습니다.
});
