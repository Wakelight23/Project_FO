import { prisma } from '../utils/prisma/index.js';

// 팀 전투력 계산 함수
export function calculateTeamPower(selectedPlayers) {
    return selectedPlayers.reduce((total, member) => {
        const player = member.player;
        // 각 능력치에 가중치 부여 = 가중치를 넣을 것인가?
        const powerScore =
            player.speed * 1.2 +
            player.goalFinishing * 1.5 +
            player.shootPower * 1.3 +
            player.defense * 1.1 +
            player.stamina * 1.0;

        // 강화 레벨에 따른 추가 보너스 (5% 씩 증가) = 일단 넣어본 것.
        const upgradeBonus = 1 + member.upgrade * 0.05;

        return total + powerScore * upgradeBonus;
    }, 0);
}

// 상대방 전투력 생성 함수
export function generateOpponentPower(playerPower) {
    const minPower = playerPower * 0.8; // 최소 80%
    const maxPower = playerPower * 1.2; // 최대 120%
    return Math.floor(Math.random() * (maxPower - minPower) + minPower);
}

// 승패 결정 함수
// myPower = 나의 전투력, opponentPower = 상대 전투력
export function determineWinner(myPower, opponentPower) {
    // 무승부일 경우
    if (myPower === opponentPower) {
        return {
            result: 2, // 0: 패배, 1: 승리, 2: 무승부
            details: {
                myPower,
                opponentPower,
                winProbability: 50,
                randomFactor: 0,
                isDraw: true,
            },
        };
    }
    // 기본 승률 계산 (전투력 차이에 따른)
    const powerDiff = myPower - opponentPower;
    // 승리 확률 :
    const winProbability = 0.5 + (powerDiff / (myPower + opponentPower)) * 0.5;

    // 운요소 추가 (0~1 사이의 랜덤값)
    const randomFactor = Math.random();

    // 승패 결정
    const isWin = randomFactor < winProbability;

    return {
        result: isWin ? 1 : 0,
        details: {
            myPower,
            opponentPower,
            winProbability: Math.round(winProbability * 100),
            randomFactor: Math.round(randomFactor * 100),
            isDraw: false,
        },
    };
}

// 선수 능력치 계산 -> 대장전에서 사용
export function calculatePlayerPower(player) {
    return Math.floor(
        player.speed * 1.2 +
            player.goalFinishing * 1.5 +
            player.shootPower * 1.3 +
            player.defense * 1.1 +
            player.stamina * 1.0
    );
}

// 게임 결과 저장
export async function updateGameResult(managerId, gameResult) {
    try {
        // Manager의 현재 rating 조회
        const manager = await prisma.manager.findUnique({
            where: { managerId },
        });

        if (!manager) {
            throw new Error('매니저를 찾을 수 없습니다.');
        }

        // rating 변경값 계산 (승: +1, 패: -1, 무: 0)
        const ratingChange = gameResult === 1 ? 1 : gameResult === 0 ? -1 : 0;

        // Manager rating 업데이트
        await prisma.manager.update({
            where: { managerId },
            data: {
                rating: manager.rating + ratingChange,
            },
        });

        // Ranking 테이블 업데이트
        const ranking = await prisma.ranking.findFirst({
            where: { managerId },
        });

        if (ranking) {
            await prisma.ranking.update({
                where: { rankingId: ranking.rankingId },
                data: {
                    win: gameResult === 1 ? ranking.win + 1 : ranking.win,
                    lose: gameResult === 0 ? ranking.lose + 1 : ranking.lose,
                    draw: gameResult === 2 ? ranking.draw + 1 : ranking.draw,
                },
            });
        } else {
            await prisma.ranking.create({
                data: {
                    managerId,
                    win: gameResult === 1 ? 1 : 0,
                    lose: gameResult === 0 ? 1 : 0,
                    draw: gameResult === 2 ? 1 : 0,
                },
            });
        }

        // Record 테이블에 게임 결과 저장
        await prisma.record.create({
            data: {
                managerId,
                gameResult,
            },
        });
    } catch (error) {
        throw new Error(`게임 결과 저장 중 오류 발생: ${error.message}`);
    }
}

// 대장전 승패 결정
export function determineCaptainWinner(myPlayers, opponentPlayers) {
    let myWins = 0;
    let opponentWins = 0;
    const results = [];

    for (let i = 0; i < 3; i++) {
        const myPower = myPlayers[i].power;
        const oppPower = opponentPlayers[i].power;

        if (myPower > oppPower) {
            myWins++;
            results.push('승리');
        } else {
            opponentWins++;
            results.push('패배');
        }

        // 2연승 체크
        if (opponentWins === 2) {
            return { result: 0, details: results }; // 패배
        }
        if (myWins === 2) {
            return { result: 1, details: results }; // 승리
        }
    }

    // 모든 경기 후 승수로 결정
    return {
        result: myWins > opponentWins ? 1 : 0,
        details: results,
    };
}
