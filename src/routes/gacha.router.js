import express from 'express';
import { prisma } from '../utils/prisma/index.js';
const gachaRouter = express();

const isLog = false;

const Log = (str) => {
  if (isLog) console.log(str);
};

// json 요청 파싱
gachaRouter.use(express.json()); // 메인으로 이동해야함

//#region regacy
/*
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
*/

/*
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
*/

//#endregion

//#region 뽑기

// 랜덤 아이템을 뽑는 함수
const getRandomItem = async () => {
  try {
    Log('뽑기 시작');
    const items = await prisma.player.findMany();
    Log('뽑기 플레이어 가져옴');
    Log(items);

    const totalProbability = items.reduce((sum, item) => sum + item.rarity, 0);
    Log('뽑기의 가중치 모두 계산');
    const randomValue = Math.random() * totalProbability;
    Log('뽑을 랜덤값 지정 완료');
    let cumulativeProbability = 0;
    Log('랜덤값 판정 유닛 검색중');
    for (const item of items) {
      cumulativeProbability += item.rarity;
      if (randomValue < cumulativeProbability) {
        Log(`뽑은 유닛`);
        Log(item);
        return item;
      }
    }
  } catch (error) {
    throw new Error('뽑기 함수 에러 팀원 김정태를 찌르세요!!');
  }
};

//#endregion

//라우터
//#region 모든뽑기정보
//모든 뽑기 정보 조회
gachaRouter.get('/api/gachas', async (req, res) => {
  res.json({
    success: true,
    items: items,
  });
});
//#endregion

//#region 단일 뽑기 정보
//단일 뽑기 정보 조회
gachaRouter.get('/api/gacha/:id', async (req, res) => {
  const isAccess = true;

  if (!isAccess) {
    Log('잘못된 접근');
  }

  try {
    const itemId = parseInt(req.params.id);
    const item = await prisma.player.findFirst({ where: { playerId: itemId } });
    if (item) {
      res.json({
        success: true,
        item: item,
      });
    } else {
      Log('잘못된 아이템 ID 입니다.');
      res.status(404).json({
        success: false,
        message: '아이템을 찾을 수 없습니다.',
      });
    }
  } catch (error) {
    throw new Error('아이템 뽑기 단일 정보 조회 에러 팀원 김정태를 찌르세요.');
  }
});
//#endregion

//auth 적용해야함 -->authM

//#region 뽑기 라우터
//뽑기
gachaRouter.post('/api/gacha', async (req, res) => {
  try {
    const { managerId } = req.body;
    const drawnItem = await getRandomItem();
    if (!drawnItem) {
      return res.json({
        success: false,
        message: '500 고객센터에 문의하세요',
      });
    }
    const teamMember = await prisma.teamMember.create({
      data: {
        playerId: drawnItem.playerId,
        managerId: managerId,
      },
    });
    return res.json({
      success: true,
      item: { drawnItem },
    });
  } catch (error) {
    throw new Error('아이템 뽑기 라우터 에러 팀원 김정태를 찌르세요.' + error);
  }
});
//#endregion

export default gachaRouter;
