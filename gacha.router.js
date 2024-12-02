import express from 'express';

const gachaRouter = express();

//#region 제거 필요
//
const PORT = process.env.PORT || 3000;
//
//#endregion

// json 요청 파싱
gachaRouter.use(express.json()); // 메인으로 이동해야함

// 뽑기 셈플
const items = [
  { id: 1, name: '호나우드', rarity: 'common' },
  { id: 2, name: '맥도날드', rarity: 'rare' },
  { id: 3, name: '신밧드', rarity: 'epic' },
  { id: 4, name: '이몽룡', rarity: 'legendary' },
];

// 랜덤 아이템을 뽑는 함수
const getRandomItem = () => {
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
};

//라우터
gachaRouter.post('/api/gacha', (req, res) => {
  const drawnItem = getRandomItem();
  res.json({
    success: true,
    item: drawnItem,
  });
});

//#region 제거 필요
// 서버 실행 테스트
gachaRouter.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
//#endregion

export default gachaRouter;
