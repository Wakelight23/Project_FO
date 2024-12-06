import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';
const gachaRouter = express();

//#region 상수 정의
// 가격 설정
const playerPrice = 500; //선수 가격
const itemPrice = 300; // 아이템 가격
const thousandPageSystem = 1000; // 천 장 시스템
const gachaLimit = 20; // 뽑기 제한
const gachaRateAddLimit = 10; // 가차 확률 증가 제한
const thousandPageSystemStartLimit = 100; // 천 장 시스템 시작 제한

//#endregion
// 로그 및 예외 처리 함수
const isLog = false;
const Log = (str) => {
    if (isLog) console.log(str);
};
const Exception = (str) => {
    throw new Error(str);
};

// json 요청 파싱
gachaRouter.use(express.json());

// 매니저 정보 조회 및 잔액 확인
const validateManager = async (accountId, resultPrice) => {
    const manager = await prisma.manager.findFirst({ where: { accountId } });
    if (!manager) {
        Log('매니저를 찾을 수 없습니다!!');
        throw new Error('잘못된 접근입니다.');
    }
    if (manager.cash < resultPrice) {
        throw new Error('잔액이 부족합니다.');
    }
    return manager;
};

// 랜덤 아이템 뽑기 공통 함수
const drawItems = async (
    drawCount,
    manager,
    getRandomFunction,
    resultPrice,
    itemType
) => {
    if (drawCount > gachaLimit) {
        throw new Error(`${gachaLimit}개 이상 뽑을 수 없습니다!!`);
    }

    const drawnItems = await getRandomFunction(drawCount, manager.gachaCount);
    if (!drawnItems.length) {
        throw new Error('뽑기에 실패했습니다.');
    }

    // 천장 시스템
    if (manager.gachaCount + drawCount >= thousandPageSystem) {
        manager.gachaCount = 0;
    } else {
        manager.gachaCount += drawCount;
    }

    // 트랜잭션 시작
    return await prisma.$transaction(async (tx) => {
        // 결제 처리
        const updatedManager = await tx.manager.update({
            where: { managerId: manager.managerId },
            data: {
                cash: manager.cash - resultPrice, // cash 값 수정
                gachaCount: manager.gachaCount,
            },
        });

        const inventoryItems = await Promise.all(
            drawnItems.map(async (item) => {
                const inventoryItem =
                    itemType === 'player'
                        ? await tx.teamMember.create({
                              data: {
                                  playerId: item.playerId,
                                  managerId: updatedManager.managerId,
                              },
                          })
                        : await tx.inventory.create({
                              data: {
                                  itemId: item.itemId,
                                  managerId: updatedManager.managerId,
                              },
                          });
                return inventoryItem;
            })
        );

        return { drawnItems, inventoryItems };
    });
};

// 모든 뽑기 정보 조회
gachaRouter.get('/gacha/players', async (req, res) => {
    const items = await prisma.player.findMany({
        select: { name: true, type: true, rarity: true, playerImage: true },
    });
    res.json({ success: true, items });
});

// 단일 뽑기 정보 조회
gachaRouter.get('/gacha/player', async (req, res) => {
    try {
        const { playerId } = req.body;
        const item = await prisma.player.findFirst({
            where: { playerId },
            select: { name: true, type: true, rarity: true, playerImage: true },
        });
        if (item) {
            res.json({ success: true, item });
        } else {
            Log('잘못된 아이템 ID 입니다.');
            res.status(404).json({
                success: false,
                message: '아이템을 찾을 수 없습니다.',
            });
        }
    } catch (error) {
        Exception('아이템 뽑기 단일 정보 조회 에러: ' + error);
    }
});

// 랜덤 플레이어를 뽑는 함수
const getRandomPlayer = async (drawCount, gachaCount) => {
    const items = await prisma.player.findMany();
    if (items.length === 0) throw new Error('플레이어 아이템이 없습니다.');

    const max = Math.max(...items.map((item) => item.rarity));
    const mid = Math.floor(max / 2);
    const isUnfortunateSystem = gachaCount > thousandPageSystemStartLimit;

    const totalProbability = items.reduce((sum, item) => {
        return (
            sum +
            (isUnfortunateSystem && item.rarity < mid
                ? Math.floor(
                      item.rarity + Math.floor(gachaCount / gachaRateAddLimit)
                  )
                : item.rarity)
        );
    }, 0);

    const drawnItems = [];
    while (drawnItems.length < drawCount) {
        const randomValue = Math.random() * totalProbability;
        let cumulativeProbability = 0;

        for (const item of items) {
            cumulativeProbability += item.rarity;
            if (randomValue < cumulativeProbability) {
                drawnItems.push(item);
                break;
            }
        }
    }
    return drawnItems;
};
//#region 선수 뽑기 라우터
// 선수뽑기 라우터 수정
gachaRouter.post('/gacha/player', authM, async (req, res) => {
    const { accountId } = req.account;
    const { drawCount } = req.body;
    const resultPrice = playerPrice * drawCount;

    try {
        const manager = await validateManager(accountId, resultPrice);

        // 랜덤 선수 뽑기
        const result = await drawItems(
            drawCount,
            manager,
            getRandomPlayer,
            resultPrice,
            'player'
        );

        return res.json({ success: true, items: result.drawnItems });
    } catch (error) {
        Exception('선수 뽑기 라우터 에러: ' + error);
    }
});
//#endregion

// 모든 아이템 정보 조회
gachaRouter.get('/gacha/items', async (req, res) => {
    const items = await prisma.item.findMany();
    res.json({ success: true, items });
});

// 단일 아이템 정보 조회
gachaRouter.get('/gacha/item', async (req, res) => {
    try {
        const { itemId } = req.body;
        const item = await prisma.item.findFirst({ where: { itemId } });
        if (item) {
            res.json({ success: true, item });
        } else {
            Log('잘못된 아이템 ID 입니다.');
            res.status(404).json({
                success: false,
                message: '아이템을 찾을 수 없습니다.',
            });
        }
    } catch (error) {
        Exception('아이템 뽑기 단일 정보 조회 에러: ' + error);
    }
});

// 랜덤 아이템을 뽑는 함수
const getRandomItem = async (drawCount) => {
    const items = await prisma.item.findMany();
    if (items.length === 0) throw new Error('아이템이 없습니다.');

    const drawnItems = [];
    for (let i = 0; i < drawCount; i++) {
        const randomIndex = Math.floor(Math.random() * items.length);
        drawnItems.push(items[randomIndex]);
    }
    return drawnItems;
};

//#region 아이템 뽑기 라우터
// 아이템 뽑기 라우터 수정
gachaRouter.post('/gacha/item', authM, async (req, res) => {
    const { accountId } = req.account;
    const { drawCount } = req.body;
    const resultPrice = itemPrice * drawCount;

    try {
        const manager = await validateManager(accountId, resultPrice);

        // 랜덤 아이템 뽑기
        const result = await drawItems(
            drawCount,
            manager,
            getRandomItem,
            resultPrice,
            'item'
        );

        return res.json({
            success: true,
            items: result.drawnItems,
            inventory: result.inventoryItems,
        });
    } catch (error) {
        Exception('아이템 뽑기 라우터 에러: ' + error);
    }
});
//#endregion

export default gachaRouter;
