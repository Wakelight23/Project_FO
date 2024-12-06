import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';
const gachaRouter = express();

// 가격 설정
const playerPrice = 500;
const ItemPrice = 200;

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

// 모든 뽑기 정보 조회
gachaRouter.get('/gacha/players', async (req, res) => {
    const items = await prisma.player.findMany({
        select: { name: true, type: true, rarity: true, playerImage: true },
    });
    res.json({ success: true, items: items });
});

// 단일 뽑기 정보 조회
gachaRouter.get('/gacha/player', async (req, res) => {
    try {
        const { playerId } = req.body;
        const item = await prisma.player.findFirst({
            where: { playerId: playerId },
            select: { name: true, type: true, rarity: true, playerImage: true },
        });
        if (item) {
            res.json({ success: true, item: item });
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
    if (items.length === 0) {
        throw new Error('플레이어 아이템이 없습니다.');
    }
    const max = Math.max(...items.map((item) => item.rarity));
    const mid = Math.floor(max / 2);
    const isUnfotunateSystem = gachaCount > 100;

    //주작 시스템
    const totalProbability = items.reduce((sum, item) => {
        if (isUnfotunateSystem) {
            return (
                sum +
                (item.rarity < mid
                    ? Math.floor(item.rarity + Math.floor(gachaCount / 10))
                    : Math.floor(item.rarity / 2))
            );
        } else {
            return sum + item.rarity;
        }
    }, 0);

    const drawnItems = [];
    for (let i = 0; i < drawCount; i++) {
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

// 뽑기 라우터
gachaRouter.post('/gacha/player', authM, async (req, res) => {
    const { accountId } = req.account;
    const { drawCount } = req.body;
    const resultPrice = playerPrice * drawCount;

    let result; // result 변수를 미리 선언

    try {
        const manager = await prisma.manager.findFirst({
            where: { accountId },
        });

        if (!manager) {
            Log('매니저를 찾을 수 없습니다!!');
            return res.json({ success: false, message: '잘못된 접근입니다.' });
        }

        if (manager.cash < resultPrice) {
            return res.json({ success: false, message: '잔액이 부족합니다.' });
        }

        // 랜덤 아이템 뽑기
        const drawnItems = await getRandomPlayer(drawCount, manager.gachaCount);
        if (!drawnItems.length) {
            throw new Error('뽑기에 실패했습니다.');
        }

        //천장 시스템
        if (manager.gachaCount + drawCount >= 1000) {
            manager.gachaCount = 0;
        }

        // 트랜잭션 시작
        result = await prisma.$transaction(async (tx) => {
            // 결제 처리
            const updatedManager = await tx.manager.update({
                where: { managerId: manager.managerId },
                data: {
                    cash: manager.cash - resultPrice,
                    gachaCount: manager.gachaCount + drawCount,
                },
            });
            // 팀원 생성 로직
            const teamMembers = await Promise.all(
                drawnItems.map((item) =>
                    tx.teamMember.create({
                        data: {
                            playerId: item.playerId,
                            managerId: updatedManager.managerId,
                        },
                    })
                )
            );

            return { drawnItems, teamMembers };
        });

        return res.json({
            success: true,
            items: result.drawnItems, // 모든 뽑은 아이템 반환
        });
    } catch (error) {
        Exception('아이템 뽑기 라우터 에러: ' + error);
    }
});

// 모든 아이템 정보 조회
gachaRouter.get('/gacha/items', async (req, res) => {
    const items = await prisma.item.findMany();
    res.json({ success: true, items: items });
});

// 단일 아이템 정보 조회
gachaRouter.get('/gacha/item', async (req, res) => {
    try {
        const { itemId } = req.body;
        const item = await prisma.item.findFirst({
            where: { itemId: itemId },
        });
        if (item) {
            res.json({ success: true, item: item });
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

const getRandomItem = async (drawCount, gachaCount) => {
    const items = await prisma.item.findMany();
    if (items.length === 0) {
        throw new Error('아이템이 없습니다.');
    }

    const drawnItems = [];
    for (let i = 0; i < drawCount; i++) {
        const randomIndex = Math.floor(Math.random() * items.length);
        drawnItems.push(items[randomIndex]);
    }

    return drawnItems;
};

// 아이템 뽑기 라우터
gachaRouter.post('/gacha/item', authM, async (req, res) => {
    const { accountId } = req.account;
    const { drawCount } = req.body;
    const resultPrice = ItemPrice * drawCount;

    let result;

    try {
        const manager = await prisma.manager.findFirst({
            where: { accountId },
        });

        if (!manager) {
            Log('매니저를 찾을 수 없습니다!!');
            return res.json({ success: false, message: '잘못된 접근입니다.' });
        }

        if (manager.cash < resultPrice) {
            return res.json({ success: false, message: '잔액이 부족합니다.' });
        }

        // 랜덤 아이템 뽑기
        const drawnItems = await getRandomItem(drawCount, manager.gachaCount);
        if (!drawnItems.length) {
            throw new Error('뽑기에 실패했습니다.');
        }

        // 천장 시스템
        if (manager.gachaCount + drawCount >= 1000) {
            manager.gachaCount = 0;
        } else {
            manager.gachaCount += drawCount;
        }

        // 트랜잭션 시작
        result = await prisma.$transaction(async (tx) => {
            // 결제 처리
            const updatedManager = await tx.manager.update({
                where: { managerId: manager.managerId },
                data: {
                    cash: manager.cash - resultPrice,
                    gachaCount: manager.gachaCount,
                },
            });

            // 인벤토리에 추가
            const inventoryItems = await Promise.all(
                drawnItems.map(async (item) => {
                    const inventoryItem = await tx.inventory.create({
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

        return res.json({
            success: true,
            items: result.drawnItems, // 모든 뽑은 아이템 반환
            inventory: result.inventoryItems, // 인벤토리에 추가된 아이템 반환
        });
    } catch (error) {
        Exception('아이템 뽑기 라우터 에러: ' + error);
    }
});

export default gachaRouter;
