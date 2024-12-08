const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
    alert('로그인 먼저 해주세요');
    location.href = '../login/login.html';
}

function logout() {
    // 로그아웃 API 호출
    const accessToken = localStorage.getItem('accessToken');

    localStorage.setItem('accessToken', '');
    localStorage.setItem('x-info', '');
    localStorage.setItem('email', '');
    window.location.href = '../index.html';
}
