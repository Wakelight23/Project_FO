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
    },
  };
}
