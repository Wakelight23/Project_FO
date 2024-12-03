import express from 'express';
import Prisma from '@prisma/client';
const gachaRouter = express();

//#region 제거 필요
//
const PORT = process.env.PORT || 3000;
//const prisma = Prisma();
//
//#endregion

// json 요청 파싱
gachaRouter.use(express.json()); // 메인으로 이동해야함

//#region Test용 데이터
const items = [
  {
    id: 1,
    name: '호나우드',
    club: 'FC 바르셀로나',
    speed: 90,
    goalFinishing: 95,
    shootPower: 92,
    defense: 40,
    stamina: 85,
    rarity: 50,
    playerImage: 'url_to_honald_image',
  },
  {
    id: 2,
    name: '맥도날드',
    club: '맨체스터 유나이티드',
    speed: 85,
    goalFinishing: 88,
    shootPower: 90,
    defense: 50,
    stamina: 80,
    rarity: 30,
    playerImage: 'url_to_macdonald_image',
  },
  {
    id: 3,
    name: '신밧드',
    club: '레알 마드리드',
    speed: 80,
    goalFinishing: 87,
    shootPower: 85,
    defense: 60,
    stamina: 75,
    rarity: 15,
    playerImage: 'url_to_sinbad_image',
  },
  {
    id: 4,
    name: '이몽룡',
    club: 'AC 밀란',
    speed: 78,
    goalFinishing: 85,
    shootPower: 84,
    defense: 75,
    stamina: 70,
    rarity: 5,
    playerImage: 'url_to_imongryong_image',
  },
  {
    id: 5,
    name: '리오넬 메시',
    club: '파리 생제르맹',
    speed: 95,
    goalFinishing: 98,
    shootPower: 94,
    defense: 45,
    stamina: 88,
    rarity: 5,
    playerImage: 'url_to_messi_image',
  },
];
//#endregion

//#region 뽑기
// 랜덤 아이템을 뽑는 함수
const getRandomItem = () => {
  const totalProbability = items.reduce((sum, item) => sum + item.rarity, 0);
  const randomValue = Math.random() * totalProbability;

  let cumulativeProbability = 0;
  for (const item of items) {
    cumulativeProbability += item.rarity;
    if (randomValue < cumulativeProbability) {
      return item;
    }
  }
};
//#endregion

//라우터
//#region 모든뽑기정보
//모든 뽑기 정보 조회
gachaRouter.get('/api/gachas', (req, res) => {
  res.json({
    success: true,
    items: items,
  });
});
//#endregion

//#region 단일 뽑기 정보
//단일 뽑기 정보 조회
gachaRouter.get('/api/gacha/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = items.find((i) => i.id === itemId);

  if (item) {
    res.json({
      success: true,
      item: item,
    });
  } else {
    res.status(404).json({
      success: false,
      message: '아이템을 찾을 수 없습니다.',
    });
  }
});
//#endregion

//auth 적용해야함 -->authM

//#region 뽑기 라우터
//뽑기
gachaRouter.post('/api/gacha', (req, res) => {
  const drawnItem = getRandomItem();
  res.json({
    success: true,
    item: drawnItem,
  });
});
//#endregion

//#region 제거 필요
// 서버 실행 테스트
gachaRouter.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
//#endregion

export default gachaRouter;
