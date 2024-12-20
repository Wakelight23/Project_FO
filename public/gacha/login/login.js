const accessToken = localStorage.getItem('accessToken');

if (accessToken) {
    alert('이미 로그인 되어있습니다.');
    location.href = '../index.html';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const response = await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
        // 토큰 저장 및 리다이렉션 추가 가능
        const accessToken = result.accessToken;
        const email = result.email;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('x-info', email);
        localStorage.setItem('email', email);
        window.location.href = '../index.html';
    } else {
        alert(result.message || '로그인 실패!');
    }
});
