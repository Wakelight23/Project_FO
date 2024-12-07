const accessToken = localStorage.getItem('accessToken');

if (accessToken) {
    alert('로그인 상태입니다.');
    location.href = '../index.html';
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    alert(result.message || response.body);
    window.location.href = '../login/login.html';
});
