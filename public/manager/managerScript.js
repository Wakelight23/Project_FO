document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    console.log('Access Token:', token); // 토큰 확인
    if (!token) {
        // 로그인하지 않은 경우 로그인 페이지로 리디렉션
        window.location.href = 'file:///C:/Project_FO/public/login/login.html';
        return;
    }

    // 매니저 유무 확인
    try {
        const response = await fetch(
            'http://localhost:3002/api/check-manager',
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`, // 토큰을 Authorization 헤더에 추가
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to check manager status');
        }

        const { isManager } = await response.json(); // 서버에서 매니저 여부를 반환한다고 가정

        if (isManager) {
            // 이미 매니저인 경우, 홈페이지로 리디렉션
            window.location.href =
                'file:///C:/Project_FO/public/home/home.html';
        } else {
            // 매니저가 아닌 경우, 매니저 생성 폼을 보여줍니다.
            document.getElementById('managerForm').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking manager status:', error);
        // 서버와의 통신 중 오류가 발생한 경우 로그인 페이지로 리디렉션
        window.location.href = 'file:///C:/Project_FO/public/login/login.html';
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
                    // 매니저가 성공적으로 생성된 경우 홈페이지로 리디렉션
                    window.location.href =
                        'file:///C:/Project_FO/public/home/home.html';
                } else {
                    console.error(
                        'Failed to create manager:',
                        response.statusText
                    );
                    // 오류 처리 (예: 로그인 페이지로 리디렉션)
                    window.location.href =
                        'file:///C:/Project_FO/public/login/login.html';
                }
            } catch (error) {
                console.error('Error:', error);
                // 서버와의 통신 중 오류가 발생한 경우 로그인 페이지로 리디렉션
                window.location.href =
                    'file:///C:/Project_FO/public/login/login.html';
            }
        });
});
