document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    console.log('Access Token:', token); // 토큰 확인
    if (!token) {
        // 로그인하지 않은 경우 로그인 페이지로 리디렉션
        window.location.href = '/login.html';
        return;
    }

    const email = localStorage.getItem('email');
    console.log('email: ', email);
    if (email) {
        fetch('https://example.com/api', {
            method: 'GET', // 또는 'POST', 'PATCH' 등 요청 메서드
            headers: {
                'Content-Type': 'application/json',
                'x-info': email, // 헤더에 email 추가
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('응답 데이터:', data);
            })
            .catch((error) => {
                console.error('오류:', error);
            });
    } else {
        console.error('localStorage에 email이 없습니다.');
    }

    // 매니저 생성 폼 제출 이벤트 리스너 추가
    document
        .getElementById('managerForm')
        .addEventListener('submit', async (event) => {
            event.preventDefault(); // 기본 폼 제출 방지

            const nickname = document.getElementById('nickname').value;

            try {
                const response = await fetch(
                    'http://localhost:3002/api/create-manager',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`, // 토큰을 Authorization 헤더에 추가
                        },
                        body: JSON.stringify({ nickname }),
                    }
                );

                const data = await response.json();
                const messageDiv = document.getElementById('message');

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'green';
                    // 성공 시 추가 동작 (예: 매니저 목록 페이지로 리디렉션)
                    // window.location.href = '/manager-list'; // 필요 시 주석 해제
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('message').textContent =
                    '서버와의 통신 중 오류가 발생했습니다.';
            }
        });
});
