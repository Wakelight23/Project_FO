const access = localStorage.getItem('accessToken');
if (!access) {
    window.location.href = '../index.html';
}

function logout() {
    // 로그아웃 API 호출
    const accessToken = localStorage.getItem('accessToken');

    window.localStorage.setItem('accessToken', '');
    window.localStorage.setItem('x-info', '');
    window.location.href = '../index.html';
}
