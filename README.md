# Project_FutsalOnline

## Part : 게임 플레이

- 자신의 TeamMember에서 능력치를 계산할 선수 3명을 선택한다
- 선택된 3명의 선수들의 능력치 합산 = '전투력'
- 각 선수들의 능력치에 설정한 가중치 더해서 전투력에 대한 차별점
- 랜덤 수 하나를 뽑아서 승률 비교로 승/패 결정
- 플레이한 게임 내용 기록

## 게임 플레이 로직 계산 방식

1. myPower & opponentPower 계산

```Javascript
// myPower 계산 예시
const player = {
  speed: 90,        // 90 * 1.2 = 108
  goalFinishing: 85, // 85 * 1.5 = 127.5
  shootPower: 88,   // 88 * 1.3 = 114.4
  defense: 75,      // 75 * 1.1 = 82.5
  stamina: 80       // 80 * 1.0 = 80
};
const upgrade = 2; // 강화 레벨 2 (10% 보너스)
const powerScore = 108 + 127.5 + 114.4 + 82.5 + 80 = 512.4
const myPower = powerScore * (1 + (2 * 0.05)) = 512.4 * 1.1 = 563.64

// opponentPower 계산
const minPower = 563.64 * 0.8 = 450.91
const maxPower = 563.64 * 1.2 = 676.37
const opponentPower = 랜덤값(450.91 ~ 676.37)
```

2. totalPower 계산

```Javascript
function calculateTeamPower(selectedPlayers) {
  return selectedPlayers.reduce((total, member) => {
    // 각 능력치 가중치 적용 -> 이 부분 적용할지 안 할지 미정
    // 이쪽 부분은 임의 수치 설정 가능
    const powerScore =
      (speed * 1.2) +          // 스피드: 20% 추가
      (goalFinishing * 1.5) +  // 골 결정력: 50% 추가
      (shootPower * 1.3) +     // 슛파워: 30% 추가
      (defense * 1.1) +        // 수비력: 10% 추가
      (stamina * 1.0);         // 스태미나: 기본

    // 강화 레벨 보너스 (레벨당 5% 추가)
    // 데이터 테이블에 저장된 upgrade의 수치에 따라 5%씩 각 능력치에 가중치 적용
    const upgradeBonus = 1 + (member.upgrade * 0.05);

    return total + (powerScore * upgradeBonus);
  }, 0);
}
```

3. 승패 결정 과정 (isWin)

```Javascript
function determineWinner(myPower, opponentPower) {
  // 승률 계산 예시
  const powerDiff = myPower - opponentPower;
  // 예: myPower = 600, opponentPower = 500
  // powerDiff = 100

  const winProbability = 0.5 + (powerDiff / (myPower + opponentPower)) * 0.5;
  // 예: 0.5 + (100 / 1100) * 0.5 = 0.545 (54.5% 승률)

  const randomFactor = Math.random(); // 0~1 사이 랜덤값
  // 예: randomFactor = 0.4

  const isWin = randomFactor < winProbability;
  // 0.4 < 0.545 이므로 승리
}
```

4. 결과들을 종합한 결과 값

```javascript
// 예시 케이스
myPower: 563.64
opponentPower: 520.00
powerDiff: 43.64
winProbability: 52.3%
randomFactor: 0.4
결과: 승리 (randomFactor < winProbability)
```
