document
    .getElementById('loginForm')
    .addEventListener('submit', async (event) => {
        event.preventDefault(); // 기본 폼 제출 방지

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3002/api/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 로그인 성공 시 액세스 토큰 저장
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('x-info', email);
                document.getElementById('message').innerText = '로그인 성공!';

                // 리디렉션 URL이 있는 경우
                // if (data.redirect) {
                //     window.location.href = data.redirect; // 매니저 생성 페이지로 리디렉션
                // } else {
                //     // 다른 페이지로 이동 (예: 대시보드)
                //     window.location.href = '/home.html';
                // }
            } else {
            }
        } catch (error) {
            console.error('로그인 중 오류 발생:', error);
            document.getElementById('message').innerText =
                '로그인 중 오류가 발생했습니다.';
        }
    });
